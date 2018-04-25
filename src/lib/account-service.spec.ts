import test from 'ava';
import {
  prePareTest,
  sleep,
  testBitcoindIp,
  testBitcoindPassword,
  testBitcoindPort,
  testBitcoindUsername,
  testZmqPubUrl
} from '../test/helpers';
import NormalAccountService from './account-service';
import { InMemoryKeyRepository } from './key-repository';
import {
  address,
  HDNode,
  networks,
  Transaction,
  TransactionBuilder
} from 'bitcoinjs-lib';
import {
  BlockchainEvent,
  getObservableBlockchain,
  ObservableBlockchain,
  TransactionArrived,
  TrustedBitcoindRPC
} from './blockchain-proxy';
import { Observable, Subject } from '@joemphilips/rxjs';
import * as Logger from 'bunyan';
import { some } from 'fp-ts/lib/Option';
import { Satoshi } from './primitives/satoshi';
import { GAP_LIMIT } from './primitives/constants';
import { Either } from 'fp-ts/lib/Either';

// 1. helper functions
const createMockTx = (...out: Array<{ address: string; amount: number }>) => {
  const builder = new TransactionBuilder(networks.testnet);
  out.map(o =>
    builder.addOutput(
      o.address,
      (Satoshi.fromBTC(o.amount).value as Satoshi).amount
    )
  );
  return builder.buildIncomplete();
};

// 2. setup
let service: NormalAccountService;
let masterHD: HDNode;
let infoSource: ObservableBlockchain;
let bchProxy: TrustedBitcoindRPC;
let logger: Logger;
let datadir: string;
test.before('set up AccountService test', () => {
  const [parentLogger, dir] = prePareTest();
  datadir = dir;
  logger = parentLogger.child({ subModule: 'accountSpec' });
  service = new NormalAccountService(logger, new InMemoryKeyRepository());
  masterHD = HDNode.fromSeedHex(
    'ffffffffffffffffffffffffffffffff',
    networks.testnet
  )
    .deriveHardened(44)
    .deriveHardened(0); // coin_type
  infoSource = getObservableBlockchain(testZmqPubUrl);
  bchProxy = new TrustedBitcoindRPC(
    '',
    testBitcoindUsername,
    testBitcoindPassword,
    testBitcoindIp,
    testBitcoindPort,
    logger
  );
});

// 3. actual tests
test('create from hd', async t => {
  const account = await service.createFromHD(masterHD, 0, infoSource, bchProxy);
  const account2 = await service.createFromHD(
    masterHD,
    1,
    infoSource,
    bchProxy
  );
  t.not(
    account.id,
    account2.id,
    'accounts created from same masterHD shuold have different id if index is different'
  );
});

test('get address for account', async t => {
  const account = await service.createFromHD(masterHD, 0, infoSource, bchProxy);
  const [account2, addr, change] = await service.getAddressForAccount(
    account,
    infoSource,
    0
  );
  const addr2 = masterHD
    .derive(0)
    .derive(0)
    .getAddress();
  const change2 = masterHD
    .derive(1)
    .derive(0)
    .getAddress();
  t.is(addr, addr2);
  t.is(change, change2);

  t.deepEqual(
    account2.watchingAddresses,
    some([addr, change]),
    'watchingAddress in account must be updated when create a new address'
  );
});

test(`handles incoming transaction event from the blockchain correctly`, async t => {
  t.plan(4);
  // prepare an account
  const mockObservable = new Subject<TransactionArrived>();
  const account = await service.createFromHD(
    masterHD,
    0,
    mockObservable,
    bchProxy
  );

  // listen to the account event
  account.subscribe(
    x => {
      logger.info(`received Event ${JSON.stringify(x)}`);
    },
    e => {
      throw e;
    },
    () => logger.info('account completed')
  );

  // get an address and pay to it.
  const [account2, addr, change] = await service.getAddressForAccount(
    account,
    infoSource,
    0
  );
  const tx = createMockTx(
    { address: addr, amount: 0.5 },
    { address: change, amount: 1.5 }
  );
  logger.debug(`piping Transaction for test ... ${tx}`);
  mockObservable.next(tx);
  await sleep(10);
  t.deepEqual(
    account2.balance,
    Satoshi.fromBTC(2).value as Satoshi,
    'an account has to understand a transaction paid to itself'
  );

  // do the same thing again
  const [account3, addr2, change2] = await service.getAddressForAccount(
    account2,
    infoSource,
    1
  );
  logger.info(
    `account3 is watching ${JSON.stringify(account3.watchingAddresses)}`
  );
  const tx2 = createMockTx(
    { address: addr2, amount: 0.01 },
    { address: change2, amount: 5 }
  );
  mockObservable.next(tx2);
  await sleep(10);
  t.deepEqual(
    account3.balance,
    Satoshi.fromBTC(7.01).value as Satoshi,
    'an account can react to incoming transaction continually'
  );

  const mockObservable2 = new Subject<TransactionArrived>();
  const account3recov = await service.createFromHD(
    masterHD,
    0,
    mockObservable2,
    bchProxy
  );
  t.is(
    account3recov.balance,
    Satoshi.fromNumber(0).value as Satoshi,
    're-created account initially has 0 balance'
  );
  account3recov.subscribe(
    x => {
      if (x.type === 'syncFinished') {
        t.is(
          account3recov.balance,
          Satoshi.fromNumber(0).value as Satoshi,
          'account should have the same balance with before when re-created'
        );
      }
    },
    e => logger.error(e)
  );
});

test('recovering account', async t => {
  const mockObservable = new Subject<TransactionArrived>();
  const account = await service.createFromHD(
    masterHD,
    5,
    mockObservable,
    bchProxy
  );

  // these addresses should be synced
  const [account2, addr, change] = await service.getAddressForAccount(
    account,
    infoSource,
    GAP_LIMIT
  );
  // these should not
  const [account3, addr2, change2] = await service.getAddressForAccount(
    account2,
    infoSource,
    GAP_LIMIT * 2 + 1
  );

  mockObservable.next(
    createMockTx({ address: addr, amount: 1 }, { address: change, amount: 2 })
  );
  mockObservable.next(
    createMockTx({ address: addr2, amount: 3 }, { address: change2, amount: 4 })
  );
  await sleep(10);
  t.is(account3.balance.amount, 10);

  const accountToRecover = await service.createFromHD(
    masterHD,
    5,
    mockObservable,
    bchProxy
  );

  const accountRecovered = await service
    .getSyncAccountTask(accountToRecover)
    .run();
  accountRecovered.fold(
    e => {
      throw e;
    },
    r => {
      t.is(
        r.balance,
        Satoshi.fromBTC(3).value as Satoshi,
        `account recreated from HD should synced with the blockchain up to ${GAP_LIMIT}`
      );
    }
  );
});

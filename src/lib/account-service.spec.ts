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
  [logger, datadir] = prePareTest();
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

test(`handles incoming events from the blockchain correctly`, async t => {
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
});

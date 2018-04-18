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
      logger.info(`received Event ${x}`);
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
  const builder = new TransactionBuilder(networks.testnet);
  builder.addOutput(addr, (Satoshi.fromBTC(0.5).value as Satoshi).amount);
  builder.addOutput(change, (Satoshi.fromBTC(1.5).value as Satoshi).amount);
  const tx = builder.buildIncomplete();

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
    account,
    0
  );
  const builder2 = new TransactionBuilder(networks.testnet);
  builder2.addOutput(addr2, (Satoshi.fromBTC(0.01).value as Satoshi).amount);
  builder2.addOutput(change2, (Satoshi.fromBTC(5).value as Satoshi).amount);
  const tx2 = builder.buildIncomplete();
  mockObservable.next(tx2);
  mockObservable.complete();
  await sleep(10);
  t.deepEqual(
    account3.balance,
    Satoshi.fromBTC(7.01).value as Satoshi,
    'an account can react to incoming transaction continually'
  );
});

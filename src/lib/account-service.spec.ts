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
import loadConfig from './config';
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

let service: NormalAccountService;
let masterHD: HDNode;
let infoSource: ObservableBlockchain;
let bchProxy: TrustedBitcoindRPC;
let logger: Logger;
let datadir: string;
test.before('', () => {
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

test(`handles incoming events from blockchain correctly`, async t => {
  const mockObservable = new Subject<TransactionArrived>();
  const account = await service.createFromHD(
    masterHD,
    0,
    mockObservable,
    bchProxy
  );
  const [account2, addr, change] = await service.getAddressForAccount(
    account,
    0
  );
  // TODO: pipe event into mockObservable and check wallet balance has been updated.
  const builder = new TransactionBuilder(networks.testnet);
  builder.addOutput(addr, 50000000); // 0.5 btc
  builder.addOutput(change, 150000000); // 1.5 btc
  const tx = builder.buildIncomplete();

  logger.debug(`piping Transaction for test ... ${tx}`);
  mockObservable.next(tx);

  await sleep(10);

  t.is(account2.balance.amount, 2);
});

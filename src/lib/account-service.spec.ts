import test from 'ava';
import {
  prePareTest,
  testBitcoindIp,
  testBitcoindPassword,
  testBitcoindPort,
  testBitcoindUsername,
  testZmqPubUrl
} from '../test/helpers';
import loadConfig from './config';
import NormalAccountService from './account-service';
import { InMemoryKeyRepository } from './key-repository';
import { HDNode, TransactionBuilder } from 'bitcoinjs-lib';
import {
  BlockchainEvent,
  getObservableBlockchain,
  ObservableBlockchain,
  TransactionArrived,
  TrustedBitcoindRPC
} from './blockchain-proxy';
import { Observable } from '@joemphilips/rxjs';

let service: NormalAccountService;
let masterHD: HDNode;
let infoSource: ObservableBlockchain;
let bchProxy: TrustedBitcoindRPC;
test.before('', () => {
  const [logger, datadir] = prePareTest();
  service = new NormalAccountService(logger, new InMemoryKeyRepository());
  masterHD = HDNode.fromSeedHex('ffffffffffffffffffffffffffffffff')
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
  const [address, change] = await service.getAddressForAccount(account, 0);
  const address2 = masterHD
    .derive(0)
    .derive(0)
    .getAddress();
  const change2 = masterHD
    .derive(1)
    .derive(0)
    .getAddress();
  t.is(address, address2);
  t.is(change, change2);
});

test(`handles incoming events from blockchain correctly`, async t => {
  const mockObservable: ObservableBlockchain = Observable.from<
    TransactionArrived
  >([]);
  const account = await service.createFromHD(
    masterHD,
    0,
    mockObservable,
    bchProxy
  );
  const [address, change] = await service.getAddressForAccount(account, 0);
  // TODO: pipe event into mockObservable and check wallet balance has been updated.
  const tx = new TransactionBuilder();
  tx.addOutput(address, 2);
});

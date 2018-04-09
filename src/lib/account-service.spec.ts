import test from 'ava';
import { prePareTest, testZmqPubUrl } from '../test/helpers';
import loadConfig from './config';
import NormalAccountService from './account-service';
import { InMemoryKeyRepository } from './key-repository';
import { HDNode } from 'bitcoinjs-lib';
import {
  getObservableBlockchain,
  ObservableBlockchain
} from './blockchain-proxy';

let service: NormalAccountService;
let masterHD: HDNode;
let infoSource: ObservableBlockchain;
test.before('', () => {
  const [logger, datadir] = prePareTest();
  service = new NormalAccountService(logger, new InMemoryKeyRepository());
  masterHD = HDNode.fromSeedHex('ffffffffffffffffffffffffffffffff')
    .deriveHardened(44)
    .deriveHardened(0); // coin_type
  infoSource = getObservableBlockchain(testZmqPubUrl);
});

test('create from hd', async t => {
  const account = await service.createFromHD(masterHD, 0, infoSource);
  const account2 = await service.createFromHD(masterHD, 1, infoSource);
  t.not(
    account.id,
    account2.id,
    'accounts created from same masterHD shuold have different id if index is different'
  );
});

test('get address for account', async t => {
  const account = await service.createFromHD(masterHD, 0, infoSource);
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

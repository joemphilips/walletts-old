import test from 'ava';
import { prePareTest } from '../test/helpers';
import loadConfig from './config';
import NormalAccountService from './account-service';
import { InMemoryKeyRepository } from './key-repository';
import { HDNode } from 'bitcoinjs-lib';

test('Account Service', async t => {
  const [logger, datadir] = prePareTest();
  const cfg = loadConfig({ datadir });
  const service = new NormalAccountService(new InMemoryKeyRepository());
  const masterHD = HDNode.fromSeedHex('ffffffffffffffffffffffffffffffff')
    .deriveHardened(44)
    .deriveHardened(0); // coin_type
  const account = await service.createFromHD(masterHD, 0);
  const account2 = await service.createFromHD(masterHD, 1);
  t.not(
    account.id,
    account2.id,
    'accounts created from same masterHD shuold have different id if index is different'
  );
});

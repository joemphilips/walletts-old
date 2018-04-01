import test from 'ava';
import WalletService from './wallet-service';
import { BasicWallet } from './wallet';
import { crypto, HDNode } from 'bitcoinjs-lib';
import { TrustedBitcoindRPC } from '../lib/blockchain-proxy';
import {
  prePareTest,
  testBitcoindIp,
  testBitcoindPassword,
  testBitcoindPort,
  testBitcoindUsername
} from '../test/helpers';
import * as bip39 from 'bip39';
import loadConfig from '../lib/config';
import hash160 = crypto.hash160;
import { InMemoryKeyRepository } from '../lib/key-repository';
import WalletRepository from '../lib/wallet-repository';

test('it can be created, deleted, and resurrected', async t => {
  // setup dependencies for wallet service.
  const [logger, datadir] = prePareTest();
  const cfg = loadConfig({ datadir });
  const service = new WalletService(
    cfg,
    new InMemoryKeyRepository(),
    new WalletRepository(),
    logger
  );
  const bchProxy = new TrustedBitcoindRPC(
    '',
    testBitcoindUsername,
    testBitcoindPassword,
    testBitcoindIp,
    testBitcoindPort,
    logger
  );
  const repo = new InMemoryKeyRepository();

  // create wallet
  const seed = [
    'zoo',
    'zoo',
    'zoo',
    'zoo',
    'zoo',
    'zoo',
    'zoo',
    'zoo',
    'zoo',
    'zoo',
    'zoo',
    'wrong'
  ];
  const hdNode = HDNode.fromSeedBuffer(bip39.mnemonicToSeed(seed.join(' ')));
  const pubKey = hdNode.getPublicKeyBuffer();
  const w = new BasicWallet(hash160(pubKey).toString('hex'), bchProxy);
  logger.debug(`seed created from entropy is ${seed}`);
  const wallet = await service.createFromSeed('Test Wallet', seed);
  t.is(
    wallet.id,
    w.id,
    'wallets created from the same seed must have the same id'
  );
  const wallet2 = await service.setNewAccountToWallet(wallet);
  t.not(wallet2, null);
  const wallet3 = (await service.setNewAccountToWallet(
    wallet2 as BasicWallet
  )) as BasicWallet;
  t.not(wallet3, null);
  t.is(
    wallet3.id,
    wallet.id,
    'id for wallet does not change even after creating account'
  );
  t.is(wallet3.accounts.length, 2);
  const wallet32 = await service.createFromSeed(`Test Wallet 2`, seed);
  t.deepEqual(
    wallet3,
    wallet32,
    `Wallet resurrected from seed should have same account from before`
  );
});

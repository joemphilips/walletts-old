import test from 'ava';
import WalletService from './wallet-service';
import { BasicWallet } from './wallet';
import { HDNode } from 'bitcoinjs-lib';
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

test('it can be created, deleted, and resurrected', async t => {
  // setup dependencies for wallet service.
  const [logger, datadir] = prePareTest();
  const cfg = loadConfig({ datadir });
  const service = new WalletService(cfg, logger);
  const bchProxy = new TrustedBitcoindRPC(
    '',
    testBitcoindUsername,
    testBitcoindPassword,
    testBitcoindIp,
    testBitcoindPort,
    logger
  );

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
  const w = new BasicWallet(pubKey, bchProxy);
  logger.debug(`seed created from entropy is ${seed}`);
  const wallet = await service.createFromSeed('Test Wallet', seed);
  t.is(wallet.id, w.id, 'wallets created from the same seed must have the same id');
});

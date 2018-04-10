import test from 'ava';
import WalletService from './wallet-service';
import { BasicWallet } from './wallet';
import { crypto, HDNode } from 'bitcoinjs-lib';
import {
  getObservableBlockchain,
  TrustedBitcoindRPC
} from '../lib/blockchain-proxy';
import {
  prePareTest,
  sleep,
  testBitcoindIp,
  testBitcoindPassword,
  testBitcoindPort,
  testBitcoindUsername,
  testZmqPubUrl
} from '../test/helpers';
import * as bip39 from 'bip39';
import loadConfig from '../lib/config';
import hash160 = crypto.hash160;
import { InMemoryKeyRepository } from '../lib/key-repository';
import WalletRepository from '../lib/wallet-repository';
import NormalAccountService from './account-service';
import * as util from 'util';
import { Balance } from './primitives/balance';
import { NormalAccount } from './account';

test('it can be created, deleted, and resurrected', async t => {
  // setup dependencies for wallet service.
  const [logger, datadir] = prePareTest();
  const cfg = loadConfig({ datadir });
  const infoSource = getObservableBlockchain(testZmqPubUrl);
  const bchProxy = new TrustedBitcoindRPC(
    '',
    testBitcoindUsername,
    testBitcoindPassword,
    testBitcoindIp,
    testBitcoindPort,
    logger
  );
  const repo = new InMemoryKeyRepository();
  const accountService = new NormalAccountService(logger, repo);
  const service = new WalletService(
    cfg,
    repo,
    new WalletRepository(),
    logger,
    accountService
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
  const w = new BasicWallet(hash160(pubKey).toString('hex'), []);
  logger.debug(`seed created from entropy is ${seed}`);
  const wallet = await service.createFromSeed('Test Wallet', seed);
  t.is(
    wallet.id,
    w.id,
    'wallets created from the same seed must have the same id'
  );
  const wallet2 = (await service.setNewAccountToWallet(
    wallet,
    infoSource,
    bchProxy
  )) as BasicWallet;
  t.not(wallet2, null);
  const wallet3 = (await service.setNewAccountToWallet(
    wallet2,
    infoSource,
    bchProxy
  )) as BasicWallet;
  t.not(wallet3, null);
  t.is(
    wallet3.id,
    wallet.id,
    'id for wallet does not change even after creating account'
  );
  logger.debug(`accounts in wallet2 are ${util.inspect(wallet2.accounts)}`);
  logger.debug(`accounts in wallet3 are ${util.inspect(wallet3.accounts)}`);
  t.is(wallet3.accounts.length, 2);

  const [address, change] = await accountService.getAddressForAccount(
    wallet3.accounts[1] as NormalAccount,
    1
  );
  bchProxy.prepare500BTC(address);

  await sleep(500);

  t.is(
    wallet3.accounts[1].balance,
    new Balance(500),
    'BTC transferred to the address derived from an account should be reflected to its Balance'
  );

  const wallet32 = await service.createFromSeed(`Test Wallet 2`, seed);
  t.deepEqual(
    wallet3,
    wallet32,
    `Wallet resurrected from seed should have same account with before`
  );
});

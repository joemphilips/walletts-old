import anyTest, { ExecutionContext, TestInterface } from 'ava';
import WalletService from './wallet-service';
import { BasicWallet } from './wallet';
import { crypto, HDNode, networks } from 'bitcoinjs-lib';
import {
  getObservableBlockchain,
  ObservableBlockchain,
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
import loadConfig, { Config } from '../lib/config';
import hash160 = crypto.hash160;
import { InMemoryKeyRepository } from '../lib/key-repository';
import WalletRepository from '../lib/wallet-repository';
import NormalAccountService, {
  AbstractAccountService
} from './account-service';
import * as util from 'util';
import { Balance } from './primitives/balance';
import { NormalAccount } from './account';
import * as Logger from 'bunyan';

// define context.
/* tslint:disable interface-over-type-literal */
type WalletServiceTestContext = {
  keyRepo: InMemoryKeyRepository;
  as: NormalAccountService;
  ws: WalletService;
};
const test = anyTest as TestInterface<WalletServiceTestContext>;

// global preperation.
let logger: Logger;
let datadir: string;
let infoSource: ObservableBlockchain;
let bchProxy: TrustedBitcoindRPC;
let cfg: Config;
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
test.before(
  'prepare wallet service',
  async (t: ExecutionContext<WalletServiceTestContext>) => {
    [logger, datadir] = prePareTest();
    cfg = loadConfig({ datadir });
    infoSource = getObservableBlockchain(testZmqPubUrl);
    bchProxy = new TrustedBitcoindRPC(
      '',
      testBitcoindUsername,
      testBitcoindPassword,
      testBitcoindIp,
      testBitcoindPort,
      logger
    );
  }
);

// local preparetion.
test.beforeEach(
  'preparet for each test',
  async (t: ExecutionContext<WalletServiceTestContext>) => {
    t.context.keyRepo = new InMemoryKeyRepository();
    const as = new NormalAccountService(logger, t.context.keyRepo);
    t.context.as = as;
    t.context.ws = new WalletService(
      cfg,
      t.context.keyRepo,
      new WalletRepository(),
      logger,
      as
    );
  }
);

test('wallet can be created, and can set accounts to it.', async (t: ExecutionContext<
  WalletServiceTestContext
>) => {
  // create wallet
  const hdNode = HDNode.fromSeedBuffer(
    bip39.mnemonicToSeed(seed.join(' ')),
    networks.testnet
  );
  const pubKey = hdNode.getPublicKeyBuffer();
  const w = new BasicWallet(hash160(pubKey).toString('hex'), []);
  logger.debug(`seed created from entropy is ${seed}`);
  const wallet = await t.context.ws.createFromSeed(
    'Test Wallet',
    seed,
    networks.testnet
  );
  t.is(
    wallet.id,
    w.id,
    'wallets created from the same seed must have the same id'
  );

  const wallet2 = (await t.context.ws.setNewAccountToWallet(
    wallet,
    infoSource,
    bchProxy
  )) as BasicWallet;
  t.not(wallet2, null);
  const wallet3 = (await t.context.ws.setNewAccountToWallet(
    wallet2,
    infoSource,
    bchProxy
  )) as BasicWallet;
  t.not(wallet3, null);
  t.is(
    wallet3.id,
    wallet.id,
    'id for a wallet does not change even after creating account'
  );

  t.is(wallet3.accounts.length, 2);

  t.not(
    wallet3.accounts[0].id,
    wallet3.accounts[1].id,
    `each account must have different ID`
  );
});

test('It is possible to get address for accounts in wallet', async (t: ExecutionContext<
  WalletServiceTestContext
>) => {
  // prepare wallet with one account.
  const wallet = await t.context.ws.createFromSeed(
    'Test Wallet',
    seed,
    networks.testnet
  );
  const wallet2 = (await t.context.ws.setNewAccountToWallet(
    wallet,
    infoSource,
    bchProxy
  )) as BasicWallet;
  const [_, address, change] = await t.context.as.getAddressForAccount(
    wallet2.accounts[0] as NormalAccount,
    1
  );

  // check address is valid
  const result = await bchProxy.validateAddress(address);
  const resultForChange = await bchProxy.validateAddress(change);
  t.true(result.isvalid);
  t.true(resultForChange.isvalid);
});

test('accounts in a wallet will be recovered when it is re-created from the seed.', async (t: ExecutionContext<
  WalletServiceTestContext
>) => {
  const wallet = await t.context.ws.createFromSeed(
    'Test Wallet',
    seed,
    networks.testnet
  );
  const wallet2 = (await t.context.ws.setNewAccountToWallet(
    wallet,
    infoSource,
    bchProxy
  )) as BasicWallet;
  const wallet3 = (await t.context.ws.setNewAccountToWallet(
    wallet2,
    infoSource,
    bchProxy
  )) as BasicWallet;

  const [_, address, change] = await t.context.as.getAddressForAccount(
    wallet3.accounts[0] as NormalAccount,
    1
  );

  bchProxy.prepare500BTC(address);

  await sleep(500);

  t.is(
    wallet3.accounts[0].balance,
    new Balance(500),
    'BTC transferred to the address derived from an account should be reflected to its Balance'
  );

  const wallet32 = await t.context.ws.createFromSeed(`Test Wallet 2`, seed);
  t.deepEqual(
    wallet3,
    wallet32,
    `Wallet resurrected from seed should have same account with before`
  );
});

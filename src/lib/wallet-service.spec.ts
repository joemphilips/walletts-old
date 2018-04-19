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
import { Satoshi } from './primitives/satoshi';
import { NormalAccount } from './account';
import * as Logger from 'bunyan';
import { AccountID } from './primitives/identity';
import { some } from 'fp-ts/lib/Option';

// define context.
/* tslint:disable interface-over-type-literal */
type WalletServiceTestContext = {
  keyRepo: InMemoryKeyRepository;
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
  const w = new BasicWallet(hash160(pubKey).toString('hex'), logger);
  logger.debug(`seed created from entropy is ${seed}`);
  const wallet = await t.context.ws.createFromSeed(
    'Test Wallet',
    seed,
    networks.testnet
  );
  t.is(
    wallet.id,
    w.id,
    'wallets created from the same seed must have the same id with the one created manually from pubKey'
  );

  // set account to wallet
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

  t.is(wallet3.accounts.size, 2);
});

test('It is possible to get an address for accounts in a wallet', async (t: ExecutionContext<
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
  const id = wallet2.accounts.keys().next().value;
  const [
    wallet3,
    address,
    change
  ] = await t.context.ws.getAddressForWalletAccount(wallet2, id);

  // check address is valid
  const result = await bchProxy.validateAddress(address);
  const resultForChange = await bchProxy.validateAddress(change);
  t.true(result.isvalid);
  t.true(resultForChange.isvalid);

  const accountMustBeUpdated = wallet2.accounts.get(id);
  if (!accountMustBeUpdated) {
    throw new Error(`failed to get account in wallet`);
  }
  t.deepEqual(accountMustBeUpdated.watchingAddresses, some([address, change]));
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

  const accountIdToGetAddressFor = wallet3.accounts.keys().next().value;
  const [
    wallet4,
    address,
    change
  ] = await t.context.ws.getAddressForWalletAccount(
    wallet3,
    accountIdToGetAddressFor
  );

  await bchProxy.client.sendToAddress(address, 0.5);
  await bchProxy.client.generate(1);
  const accountReceived = wallet4.accounts.get(accountIdToGetAddressFor);
  if (!accountReceived) {
    throw new Error(`failed to get account!`);
  }
  t.is(
    accountReceived.balance,
    Satoshi.fromBTC(0.5).value as Satoshi,
    'BTC transferred to the address derived from an account should be reflected to its Balance'
  );

  const wallet32 = await t.context.ws.createFromSeed(`Test Wallet 2`, seed);
  t.deepEqual(
    wallet3,
    wallet32,
    `Wallet resurrected from a seed should have same account with the one before before`
  );
});

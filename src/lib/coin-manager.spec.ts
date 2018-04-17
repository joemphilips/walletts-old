import anyTest, { ExecutionContext, TestInterface } from 'ava';
import * as uuid from 'uuid';
import CoinManager, { getAndIncrement, isAlreadyHave } from './coin-manager';
import {
  prePareTest,
  sleep,
  testBitcoindIp,
  testBitcoindPassword,
  testBitcoindPort,
  testBitcoindUsername,
  testZmqPubUrl
} from '../test/helpers';
import {
  InMemoryKeyRepository,
  default as KeyRepository
} from './key-repository';
import {
  BlockchainProxy,
  getObservableBlockchain,
  TrustedBitcoindRPC
} from './blockchain-proxy';
import { CoinID, MyWalletCoin } from './primitives/wallet-coin';
import fixtures from '../test/fixtures/transaction.json';
import { address, HDNode, networks, script, Transaction } from 'bitcoinjs-lib';
import { some } from 'fp-ts/lib/Option';
import { Satoshi } from './primitives/satoshi';
import * as util from 'util';
import { BatchOption, Block } from 'bitcoin-core';
import * as Logger from 'bunyan';
import NormalAccountService from './account-service';
import { right } from 'fp-ts/lib/Either';
import { EventEmitter } from 'events';
import { OutpointWithScriptAndAmount } from './primitives/utils';

// 1. define global variables
/* tslint:disable interface-over-type-literal */
let bch: BlockchainProxy;
let logger: Logger;
let datadir: string;

type CoinManagerTestContext = {
  man: CoinManager;
  bch: BlockchainProxy;
  logger: Logger;
  keyRepo: KeyRepository;
  masterHD: HDNode;
};
const test = anyTest as TestInterface<CoinManagerTestContext>;

test.before('prepare test for CoinManager', async t => {
  [logger, datadir] = prePareTest();
  bch = new TrustedBitcoindRPC(
    '',
    testBitcoindUsername,
    testBitcoindPassword,
    testBitcoindIp,
    testBitcoindPort,
    logger
  );
});

// 2. define utility function used from testContext
/**
 * calling this function at the same time in asyncronous mannter might cause
 * work queue in the bitcoind to exceed its limit. so use carefully.
 * @param {TrustedBitcoindRPC} bchProxy
 * @param {number} num
 * @returns {Promise<MyWalletCoin[]>}
 * TODO: only `createTx` and `broadcast` requires to interact with the blockchain.
 * TODO: So separate block generation logic to different function.
 */
async function prepareCoinsWith1BTC(
  bchProxy: TrustedBitcoindRPC,
  num: number = 6,
  addrs: ReadonlyArray<string>
): Promise<MyWalletCoin[]> {
  // increment counter and wait other contexts to finish calling this function
  const txHashes = await Promise.all(
    addrs.map(a => bchProxy.client.sendToAddress(a, 1))
  );
  await bchProxy.client.generate(1);

  const scriptPubkeys: ReadonlyArray<Buffer> = addrs.map(a =>
    address.toOutputScript(a, networks.testnet)
  );

  return new Array(num).fill('').map(
    (_, i) =>
      new MyWalletCoin(
        scriptPubkeys[i],
        'pubkeyhash',
        null,
        some('Coin for Test'),
        txHashes[i],
        Satoshi.fromBTC(1).fold(e => {
          throw e;
        }, s => s)
      )
  );
}

test.beforeEach(
  'prepare beforeEach test for CoinManager',
  async (t: ExecutionContext<CoinManagerTestContext>) => {
    t.context.bch = bch;
    const keyRepo = new InMemoryKeyRepository();
    t.context.keyRepo = keyRepo;
    t.context.man = new CoinManager(logger, keyRepo, bch);
    t.context.masterHD = HDNode.fromSeedHex(
      'ffffffffffffffffffffffffffffffff',
      networks.testnet
    )
      .deriveHardened(44)
      .deriveHardened(0); // coin_type
  }
);

// 4. run actual tests
test('get total amount', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const num = 6;
  const addrs = new Array(num)
    .fill(0)
    .map((_, i) => t.context.masterHD.derive(i).getAddress());
  const coins = await prepareCoinsWith1BTC(t.context.bch, num, addrs);
  if (!coins) {
    throw new Error(`failed to prepare coins!`);
  }
  logger.info(`coins are ${JSON.stringify(coins)}`);
  for (const c of coins) {
    t.context.man.coins.set(new CoinID(uuid.v4()).id, c);
  }

  logger.trace(
    `Prepared coins are ${JSON.stringify([...t.context.man.coins])}`
  );
  t.deepEqual(t.context.man.total, Satoshi.fromBTC(6).value as Satoshi);
});

test('pickCoinsForAmount', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const num = 1;
  const addrs = new Array(num)
    .fill(0)
    .map((_, i) => t.context.masterHD.derive(i).getAddress());
  const coinsToInsert = await prepareCoinsWith1BTC(t.context.bch, num, addrs);
  t.context.man.coins.set(new CoinID(uuid.v4()).id, coinsToInsert[0]);
  const coins = await t.context.man.pickCoinsForAmount(Satoshi.fromBTC(0.9)
    .value as Satoshi);
  t.is(coins.length, 1);
  t.is(coins[0].amount.toBTC(), 1);
});

test('coin selection will throw Error if not enough funds available', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const num = 1;
  const addrs = new Array(num)
    .fill(0)
    .map((_, i) => t.context.masterHD.derive(i).getAddress());
  const coinsToInsert = await prepareCoinsWith1BTC(t.context.bch, num, addrs);
  t.context.man.coins.set(new CoinID(uuid.v4()).id, coinsToInsert[0]);
  await t.throws(
    () => t.context.man.pickCoinsForAmount(Satoshi.fromBTC(2).value as Satoshi),
    Error
  );
  await t.notThrows(() =>
    t.context.man.pickCoinsForAmount(Satoshi.fromBTC(1).value as Satoshi)
  );
});

test('create transaction and broadcast, then check the balance', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  t.plan(2);
  // 1. prepare account
  const man = t.context.man;
  const as = new NormalAccountService(logger, t.context.keyRepo);
  const obs = getObservableBlockchain(testZmqPubUrl);
  const account = await as.createFromHD(
    t.context.masterHD,
    0,
    obs,
    t.context.bch
  );
  const [account2, _, changeAddress] = await as.getAddressForAccount(account);

  // 2. set coins
  const num = 1;
  const addrs = new Array(num)
    .fill(0)
    .map((no, i) => t.context.masterHD.derive(i).getAddress());
  const coins = await prepareCoinsWith1BTC(t.context.bch, num, addrs);
  logger.info(`going to set coins ${JSON.stringify(coins)}`);
  t.context.man.coins.set(new CoinID(uuid.v4()).id, coins[0]);

  // 3. create Tx
  const addressToPay = [
    {
      address: 'mhwVU9YLs5PSGqVjPK2RewGNeKBLV4eEXo', // random address.
      amountInSatoshi: Satoshi.fromBTC(0.1).value as Satoshi
    }
  ];

  const txResult = await man.createTx(
    account2.id,
    coins,
    addressToPay,
    changeAddress
  );
  logger.debug('tx created');
  t.truthy(txResult, ` failed to create tx ${txResult}`);

  await t.notThrows(async () => man.broadCast(txResult));
});

test('import outpoint as its own coin.', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const man = t.context.man;
  // 1. prepare account.
  const as = new NormalAccountService(logger, t.context.keyRepo);
  const obs = getObservableBlockchain(testZmqPubUrl);
  const a1 = await as.createFromHD(t.context.masterHD, 0, obs, t.context.bch);
  const [a2, addr, change] = await as.getAddressForAccount(a1);

  const outpoints = [
    {
      id: 'deadbeef0000',
      index: 0,
      scriptPubKey: address.toOutputScript(addr, networks.testnet),
      amount: Satoshi.fromBTC(1).value as Satoshi
    },
    {
      id: 'deadbeef0001',
      index: 0,
      scriptPubKey: address.toOutputScript(addr, networks.testnet),
      amount: Satoshi.fromBTC(2).value as Satoshi
    }
  ];

  t.deepEqual(
    outpoints.map(isAlreadyHave(man.coins)),
    [false, false],
    'isAlreadyHave must return false when importing for the first time'
  );

  await man.importOurOutPoints(a2.id, outpoints);

  t.deepEqual(
    man.total,
    Satoshi.fromBTC(3).value as Satoshi,
    'failed to import outpoint as a WalletCoin'
  );
  t.deepEqual(
    outpoints.map(isAlreadyHave(man.coins)),
    [true, true],
    'isAlreadyHave must return true when importing the same outpoint'
  );
  logger.info(`lets increment`);
  t.deepEqual(
    outpoints.map(
      o => getAndIncrement(man.coins)(CoinID.fromOutpoint(o).id).confirmation
    ),
    [1, 1],
    `getAndIncrement must increment coins confirmation`
  );
  logger.info(`increment finished`);
  await man.importOurOutPoints(a2.id, outpoints);
  logger.info(`importing finished`);
  t.deepEqual(
    man.total,
    Satoshi.fromBTC(3).value as Satoshi,
    'Importing same coins should not change the total balance'
  );
  const getCoins = (out: OutpointWithScriptAndAmount): MyWalletCoin => {
    const coin = man.coins.get(CoinID.fromOutpoint(out).id);
    if (coin) {
      return coin;
    } else {
      throw new Error();
    }
  };
  t.deepEqual(
    outpoints.map(getCoins).map(c => c.confirmation),
    [1, 1],
    'importing same coin twice must result to increment confirmation of the coin'
  );
});

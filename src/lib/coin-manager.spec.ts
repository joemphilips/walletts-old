import anyTest, { ExecutionContext, TestInterface } from 'ava';
import * as uuid from 'uuid';
import CoinManager, { CoinID } from './coin-manager';
import {
  prePareTest,
  testBitcoindIp,
  testBitcoindPassword,
  testBitcoindPort,
  testBitcoindUsername
} from '../test/helpers';
import { InMemoryKeyRepository } from './key-repository';
import { BlockchainProxy, TrustedBitcoindRPC } from './blockchain-proxy';
import { MyWalletCoin } from './primitives/wallet-coin';
import fixtures from '../test/fixtures/transaction.json';
import { address, networks, script, Transaction } from 'bitcoinjs-lib';
import { some } from 'fp-ts/lib/Option';
import { Balance } from './primitives/balance';
import * as util from 'util';
import { BatchOption } from 'bitcoin-core';
import * as Logger from 'bunyan';

function flatten(arr: any[]): any[] {
  return arr.reduce((flat, toFlatten): any => {
    return flat.concat(
      Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
    );
  }, []);
}

/**
 * calling this function at the same time in asyncronous mannter might cause
 * work queue in the bitcoind to exceed its limit. so use carefully.
 * @param {TrustedBitcoindRPC} bchProxy
 * @param {number} num
 * @returns {Promise<MyWalletCoin[]>}
 */
async function prepareCoins(
  bchProxy: TrustedBitcoindRPC,
  num: number = 6
): Promise<MyWalletCoin[]> {
  const args = Array(num).fill({ method: 'getnewaddress', parameters: [] });
  const addrs: string[] = await bchProxy.client.command(args);
  const args2 = addrs.map(a => ({
    method: 'generatetoaddress',
    parameters: [1, a]
  }));
  const blockhashes: string[][] = await bchProxy.client.command(
    args2 as BatchOption[]
  );
  util.debug(`blockchashes are ${blockhashes}`);
  await bchProxy.client.generate(100);
  const scriptPubkeys: ReadonlyArray<Buffer> = addrs.map(a =>
    address.toOutputScript(a, networks.testnet)
  );
  const blocks = await Promise.all(
    flatten(blockhashes).map(b => bchProxy.client.getBlock(b, true))
  );
  util.debug(`first block in blocks is ${JSON.stringify(blocks[0])}`);
  const coinBaseHash = blocks.map((a: any) => a.tx[0]);

  return Array(num)
    .fill('foo') // to avoid null value error.
    .map(
      i =>
        new MyWalletCoin(
          scriptPubkeys[i],
          'pubkeyhash',
          null,
          some('Coin for Test'),
          coinBaseHash[i],
          new Balance(50)
        )
    );
}

/* tslint:disable interface-over-type-literal */
type CoinManagerTestContext = {
  man: CoinManager;
  bch: BlockchainProxy;
  logger: Logger;
};
const test = anyTest as TestInterface<CoinManagerTestContext>;

test.beforeEach(
  'prepare test for CoinManager',
  async (t: ExecutionContext<CoinManagerTestContext>) => {
    const [logger, datadir] = prePareTest();
    const bch = new TrustedBitcoindRPC(
      '',
      testBitcoindUsername,
      testBitcoindPassword,
      testBitcoindIp,
      testBitcoindPort,
      logger
    );
    t.context.bch = bch;
    t.context.man = new CoinManager(logger, new InMemoryKeyRepository(), bch);
    t.context.logger = logger;
  }
);

test('get total amount', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const coins = await prepareCoins(t.context.bch, 6);
  for (const c of coins) {
    t.context.man.coins.set(new CoinID(uuid.v4()), c);
  }

  t.context.logger.trace(
    `Prepared coins are ${JSON.stringify([...t.context.man.coins])}`
  );
  t.deepEqual(t.context.man.total, new Balance(300));
});

test('chooseCoinsFromAmount', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const coinsToInsert = await prepareCoins(t.context.bch, 1);
  t.context.man.coins.set(new CoinID(uuid.v4()), coinsToInsert[0]);
  const coins = await t.context.man.chooseCoinsFromAmount(3);
  t.is(coins.length, 1);
  t.is(coins[0].amount.amount, 50);
});

test('coin selection will throw Error if not enough funds available', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const coinsToInsert = await prepareCoins(t.context.bch, 1);
  t.context.man.coins.set(new CoinID(uuid.v4()), coinsToInsert[0]);
  await t.throws(() => t.context.man.chooseCoinsFromAmount(51), Error);
  await t.notThrows(() => t.context.man.chooseCoinsFromAmount(50));
});

test('creating transaction', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const man = t.context.man;
  const coinsToInsert = await prepareCoins(t.context.bch, 1);
  man.coins.set(new CoinID(uuid.v4()), coinsToInsert[0]);
  const coins = await man.chooseCoinsFromAmount(40);
  t.is(coins[0].amount.amount, 50);
});

test('broadCasting Transaction', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  t.pass();
});

test('import outpoint as its own coin.', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  t.pass();
});

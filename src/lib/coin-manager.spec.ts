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
import { address, script, Transaction } from 'bitcoinjs-lib';
import { some } from 'fp-ts/lib/Option';
import { Balance } from './primitives/balance';
import * as util from 'util';

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
  util.debug(`addrs are ${addrs}`);
  const blockhashes: string[][] = await Promise.all(
    addrs.map(a => bchProxy.client.generateToAddress(1, a))
  );
  util.debug(`blockchashes are ${blockhashes}`);
  await bchProxy.client.generate(100);
  const scriptPubkeys: ReadonlyArray<Buffer> = addrs.map(a =>
    address.toOutputScript(a)
  );
  util.debug(scriptPubkeys.toString());
  const blocks = await Promise.all(
    flatten(blockhashes).map((a: string) => bchProxy.client.getBlock(a, 2))
  );
  const coinBaseHash = blocks.map((a: any) => a.tx[0].txid);
  return Array(num).map(
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
  }
);

test('get total amount', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  await prepareCoins(t.context.bch, 6).then(coins =>
    coins.map(c => t.context.man.coins.set(new CoinID(uuid.v4()), c))
  );
  t.is(t.context.man.total, new Balance(300));
});
test('chooseCoinsFromAmount', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  t.pass();
});
test('creating transaction', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  t.pass();
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

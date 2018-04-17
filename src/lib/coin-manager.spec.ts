import anyTest, { ExecutionContext, TestInterface } from 'ava';
import * as uuid from 'uuid';
import CoinManager, { CoinID } from './coin-manager';
import {
  prePareTest,
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
import { MyWalletCoin } from './primitives/wallet-coin';
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

// 2. create global event emitter which counts for the coin preparation.
/**
 * number of test which requires to run prepareCoins
 * @type {number}
 */
const PREPERATION_CONTEXT_NUM = 4;
class Prepare extends EventEmitter {
  public soFarPreparedContext: number;
  constructor() {
    super();
    this.soFarPreparedContext = 0;
  }

  public incrementPrepare(): void {
    this.soFarPreparedContext++;
    if (this.soFarPreparedContext === PREPERATION_CONTEXT_NUM) {
      this.emit('prepared');
    }
  }
}

const prepare = new Prepare();
prepare.once('prepared', () => {
  bch.client
    .generate(100)
    .then(() => {
      logger.info('generated 100 blocks');
      prepare.emit('generated');
    })
    .catch((e: Error) => {
      util.debug('not generated');
      throw e;
    });
});

async function promise100block(): Promise<{}> {
  return new Promise((resolve, reject) => {
    prepare.once('generated', resolve);
    prepare.on('error', reject);
  });
}

// 3. define utility function used from testContext
/**
 * calling this function at the same time in asyncronous mannter might cause
 * work queue in the bitcoind to exceed its limit. so use carefully.
 * @param {TrustedBitcoindRPC} bchProxy
 * @param {number} num
 * @returns {Promise<MyWalletCoin[]>}
 * TODO: only `createTx` and `broadcast` requires to interact with the blockchain.
 * TODO: So separate block generation logic to different function.
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

  // increment counter and wait other contexts to finish calling this function
  prepare.incrementPrepare();
  try {
    await promise100block();
  } catch (e) {
    logger.debug(`error during generating block`);
    throw e;
  }

  const scriptPubkeys: ReadonlyArray<Buffer> = addrs.map(a =>
    address.toOutputScript(a, networks.testnet)
  );
  const blocks = (await Promise.all(
    flatten(blockhashes).map(b => bchProxy.client.getBlock(b, true))
  )) as Block[];
  const coinBaseHash = blocks.map(a => a.tx[0]) as string[];

  return Array(num)
    .fill('foo') // to avoid null value error.
    .map(
      (_, i) =>
        new MyWalletCoin(
          scriptPubkeys[i],
          'pubkeyhash',
          null,
          some('Coin for Test'),
          coinBaseHash[i],
          Satoshi.fromBTC(50).value as Satoshi
        )
    );
}
function flatten(arr: any[]): any[] {
  return arr.reduce((flat, toFlatten): any => {
    return flat.concat(
      Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten
    );
  }, []);
}

test.beforeEach(
  'prepare beforeEach test for CoinManager',
  async (t: ExecutionContext<CoinManagerTestContext>) => {
    t.context.bch = bch;
    const keyRepo = new InMemoryKeyRepository();
    t.context.keyRepo = keyRepo;
    t.context.man = new CoinManager(logger, keyRepo, bch);
  }
);

// 4. run actual tests
test('get total amount', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const coins = await prepareCoins(t.context.bch, 6);
  for (const c of coins) {
    t.context.man.coins.set(new CoinID(uuid.v4()), c);
  }

  logger.trace(
    `Prepared coins are ${JSON.stringify([...t.context.man.coins])}`
  );
  t.deepEqual(t.context.man.total, Satoshi.fromBTC(300).value as Satoshi);
});

test('chooseCoinsFromAmount', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const coinsToInsert = await prepareCoins(t.context.bch, 1);
  t.context.man.coins.set(new CoinID(uuid.v4()), coinsToInsert[0]);
  const coins = await t.context.man.chooseCoinsFromAmount(Satoshi.fromBTC(3)
    .value as Satoshi);
  t.is(coins.length, 1);
  t.is(coins[0].amount.toBTC(), 50);
});

test('coin selection will throw Error if not enough funds available', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  const coinsToInsert = await prepareCoins(t.context.bch, 1);
  t.context.man.coins.set(new CoinID(uuid.v4()), coinsToInsert[0]);
  await t.throws(
    () =>
      t.context.man.chooseCoinsFromAmount(Satoshi.fromBTC(51).value as Satoshi),
    Error
  );
  await t.notThrows(() =>
    t.context.man.chooseCoinsFromAmount(Satoshi.fromBTC(50).value as Satoshi)
  );
});

test('create transaction and broadcast, then check the balance', async (t: ExecutionContext<
  CoinManagerTestContext
>) => {
  t.plan(2);
  // 1. prepare account
  const man = t.context.man;
  const as = new NormalAccountService(logger, t.context.keyRepo);
  const masterHD = HDNode.fromSeedHex(
    'ffffffffffffffffffffffffffffffff',
    networks.testnet
  )
    .deriveHardened(44)
    .deriveHardened(0); // coin_type
  const obs = getObservableBlockchain(testZmqPubUrl);
  const account = await as.createFromHD(masterHD, 0, obs, t.context.bch);
  const [account2, _, changeAddress] = await as.getAddressForAccount(account);

  // 2. set coins
  const coins = await prepareCoins(t.context.bch, 1);
  logger.info(`going to set coins ${JSON.stringify(coins)}`);
  t.context.man.coins.set(new CoinID(uuid.v4()), coins[0]);

  // 3. create Tx
  const addressToPay = [
    {
      address: 'mhwVU9YLs5PSGqVjPK2RewGNeKBLV4eEXo', // random address.
      amountInSatoshi: Satoshi.fromBTC(10).value as Satoshi
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
  t.pass();
});

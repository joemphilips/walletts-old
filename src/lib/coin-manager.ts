import {
  BlockchainEvent,
  BlockchainProxy,
  TrustedBitcoindRPC
} from './blockchain-proxy';
import Keystore, { default as KeyRepository } from './key-repository';
import logger from './logger';
import { MyWalletCoin } from './primitives/wallet-coin';
import WalletDB from './wallet-service';
import * as Logger from 'bunyan';
/* tslint:disable-next-line:no-submodule-imports */
import {
  address,
  Network,
  networks,
  Out,
  Transaction,
  TransactionBuilder
} from 'bitcoinjs-lib';
import { AccountID } from './primitives/identity';
import { Either, left, right } from 'fp-ts/lib/Either';
import { Outpoint } from 'bitcoin-core';
import * as _ from 'lodash';
import { Balance } from './primitives/balance';

export interface OutpointWithScriptAndAmount {
  id: string;
  index: number;
  scriptPubKey: Buffer;
  amount: number;
}

/**
 * internal key for referencing to WalletCoins
 */
export class CoinID {
  public static fromOutpoint(outpoint: Outpoint): CoinID {
    const id = outpoint.id + outpoint.index.toString(16);
    return new CoinID(id);
  }
  constructor(public id: string) {}
}

/**
 * handle `Physical` tasks for accounts.
 * e.g. coin selection, holding redeemScript etc.
 */
export default class CoinManager {
  public readonly coins: Map<CoinID, MyWalletCoin>;
  public readonly logger: Logger;
  public readonly feeProvider: (target?: number) => Promise<number>;

  constructor(
    log: Logger,
    public keyRepo: KeyRepository,
    public bchProxy: TrustedBitcoindRPC
  ) {
    this.logger = log.child({ subModule: 'CoinManager' });
    this.coins = new Map<CoinID, MyWalletCoin>();
    this.logger.trace('coinmanager initialized');
    this.feeProvider = async (target = 6) => {
      const feeRate = await this.bchProxy.client
        .estimateSmartFee(target)
        .then(r => r.feerate);
      if (!feeRate) {
        throw Error(`failed to provide fee!`);
      }
      return feeRate;
    };
  }

  public sign<K extends Keystore>(key: K): boolean {
    return false;
  }

  public get total(): Balance {
    return new Balance(
      Array.from(this.coins.entries())
        .map(([k, v]) => v)
        .reduce((a, b) => a + b.amount.amount, 0)
    );
  }

  // TODO: Implement Murch's algorithm.  refs: https://github.com/bitcoin/bitcoin/pull/10637
  public async chooseCoinsFromAmount(amount: number): Promise<MyWalletCoin[]> {
    if (this.total.amount < amount) {
      throw Error(`not enough funds!`);
    }
    const result: MyWalletCoin[] = [];
    for (const [id, coin] of this.coins.entries()) {
      if (
        result.map(c => c.amount).reduce((a, b) => a + b.amount, 0) < amount
      ) {
        result.push(coin);
      }
    }
    return result;
  }

  public async createTx(
    id: AccountID,
    coins: MyWalletCoin[],
    addressAndAmount: ReadonlyArray<{ address: string; amount: number }>,
    generatedAddressNumSofar: number,
    chainParam: Network = networks.testnet
  ): Promise<Either<Error, Transaction>> {
    const builder = new TransactionBuilder();
    this.logger.debug(`going to add tx from ${coins.map(c => c.txid)}`);
    coins.map((c, i) => builder.addInput(c.txid, i));
    addressAndAmount.map(a =>
      builder.addOutput(address.toOutputScript(a.address, chainParam), a.amount)
    );

    // prepare change.
    const totalOut = addressAndAmount
      .map(e => e.amount)
      .reduce((a, b) => a + b, 0);
    const totalIn = coins.map(c => c.amount).reduce((a, b) => a + b.amount, 0);
    const delta = totalOut - totalIn;
    const feeRate = await this.feeProvider();
    const fee = feeRate * builder.buildIncomplete().byteLength();
    const changeAmount = delta - fee;
    const changeAddress = await this.keyRepo.getAddress(
      id,
      `1/${generatedAddressNumSofar}`
    );
    if (!changeAddress) {
      return left(
        Error(
          `failed to get change address from KeyRepository for ${id}! something must be wrong.`
        )
      );
    }
    builder.addOutput(changeAddress as string, changeAmount);

    // sign every input
    const HDNode = await this.keyRepo.getHDNode(id);
    if (!HDNode) {
      throw new Error(`could not retrieve HDNode!`);
    }
    coins.forEach((no, i) => builder.sign(i, HDNode.keyPair));

    return right(builder.build());
  }

  public async broadCast(tx: Transaction): Promise<void> {
    const hexTx = tx.toHex();
    await this.bchProxy.send(hexTx);
  }

  /**
   * Contextify Transaction output as a WalletCoin and put it into CoinMaps
   * @param {AccountID} id
   * @param {OutpointWithScriptAndAmount[]} outpoints
   * @returns {null}
   */
  public async importOurOutPoints(
    id: AccountID,
    outpoints: OutpointWithScriptAndAmount[]
  ): Promise<null> {
    // check key for AccountID exists
    const pubkey = await this.keyRepo.getPubKey(id);
    if (!pubkey) {
      throw new Error(
        `Tried to pick output into account which is not ourselves`
      );
    }

    // convert to WalletCoin
    const coins = outpoints.map((o: OutpointWithScriptAndAmount) =>
      MyWalletCoin.fromOutpointAndPubKey(
        o,
        o.scriptPubKey,
        Buffer.from(pubkey, 'hex'),
        o.amount
      )
    );

    // append to this.coins
    _.zip(outpoints, coins).forEach(pair => {
      if (!pair[0] || !pair[1]) {
        return;
      }
      this.coins.set(
        CoinID.fromOutpoint(pair[0] as Outpoint),
        pair[1] as MyWalletCoin
      );
    });
    this.logger.info(`successfully imported our Coin from Blockchain`);
    this.logger.info(
      `coins inside coinmanager are ${JSON.stringify(this.coins)}`
    );
    return null;
  }
}

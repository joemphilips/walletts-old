import { TrustedBitcoindRPC } from './blockchain-proxy';
import Keystore, { default as KeyRepository } from './key-repository';
import { MyWalletCoin } from './primitives/wallet-coin';
import * as Logger from 'bunyan';
/* tslint:disable-next-line:no-submodule-imports */
import {
  address,
  Network,
  networks,
  Transaction,
  TransactionBuilder
} from 'bitcoinjs-lib';
import { AccountID } from './primitives/identity';
import { Outpoint } from 'bitcoin-core';
import * as _ from 'lodash';
import { Satoshi } from './primitives/satoshi';
import { FALLBACK_FEE } from './primitives/constants';
import { OutpointWithScriptAndAmount } from './primitives/utils';

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
  public readonly feeProvider: (
    txWeightInKB: number,
    target?: number
  ) => Promise<Satoshi>;

  constructor(
    log: Logger,
    public keyRepo: KeyRepository,
    public bchProxy: TrustedBitcoindRPC
  ) {
    this.logger = log.child({ subModule: 'CoinManager' });
    this.coins = new Map<CoinID, MyWalletCoin>();
    this.logger.trace('coinmanager initialized');
    this.feeProvider = async (txWeightInKB: number, target = 6) => {
      return this.bchProxy.client.estimateSmartFee(target).then(r => {
        if (r.feerate && r.feerate !== -1) {
          this.logger.trace(
            `feeEstimation result is ${r.feerate} and weight is ${txWeightInKB}`
          );
          return Satoshi.fromNumber(r.feerate * txWeightInKB).fold(e => {
            throw e;
          }, satoshi => satoshi);
        }
        throw new Error(
          `failed to retrieve feeRate, result was ${JSON.stringify(r)}`
        );
      });
    };
  }

  public sign<K extends Keystore>(key: K): boolean {
    return false;
  }

  public get total(): Satoshi {
    return Satoshi.fromNumber(
      Array.from(this.coins.entries())
        .map(([k, v]) => v)
        .reduce((a, b) => a + b.amount.amount, 0)
    ).value as Satoshi;
  }

  // TODO: Implement Murch's algorithm.  refs: https://github.com/bitcoin/bitcoin/pull/10637
  public async pickCoinsForAmount(
    targetSatoshi: Satoshi
  ): Promise<MyWalletCoin[]> {
    if (this.total.amount < targetSatoshi.amount) {
      throw Error(`not enough funds!`);
    }
    const result: MyWalletCoin[] = [];
    for (const [id, coin] of this.coins.entries()) {
      const amountSoFar = result
        .map(c => c.amount)
        .reduce((a, b) => a.chain(s => s.credit(b)), Satoshi.fromNumber(0))
        .fold(e => {
          throw e;
        }, a => a);
      if (amountSoFar.amount < targetSatoshi.amount) {
        result.push(coin);
      }
    }
    return result;
  }

  public async createTx(
    id: AccountID,
    coins: MyWalletCoin[],
    addressAndAmount: ReadonlyArray<{
      address: string;
      amountInSatoshi: Satoshi;
    }>,
    changeAddress: string,
    chainParam: Network = networks.testnet
  ): Promise<Transaction> {
    const builder = new TransactionBuilder(chainParam);
    this.logger.debug(`going to add tx from ${coins.map(c => c.txid)}`);
    coins.map((c, i) => builder.addInput(c.txid, i));
    addressAndAmount.map(a =>
      builder.addOutput(
        address.toOutputScript(a.address, chainParam),
        a.amountInSatoshi.amount
      )
    );

    // prepare change.
    const totalOut = addressAndAmount
      .map(e => e.amountInSatoshi)
      .reduce((a, b) => a.chain(s => s.credit(b)), Satoshi.fromNumber(0))
      .fold(e => {
        throw new Error(`failed to get total output value`);
      }, a => a);
    const totalIn = coins
      .reduce((a, b) => a.chain(s => s.credit(b.amount)), Satoshi.fromNumber(0))
      .fold(e => {
        throw new Error(`failed to get total input value`);
      }, a => a);

    const delta = totalIn.debit(totalOut).fold(e => {
      throw new Error(
        `total Input ${totalIn.amount} must be greater than total Output ${
          totalOut.amount
        }!`
      );
    }, a => a);
    this.logger.debug(`fetching fee from feeProvider ...`);
    const fee: Satoshi = await this.feeProvider(
      builder.buildIncomplete().weight()
    ).catch(() => FALLBACK_FEE);
    const changeAmount = delta.debit(fee).fold(e => {
      throw new Error(
        `${e.toString()} ! delta of output and input was ${
          delta.amount
        } and fee estimated was ${fee.amount}`
      );
    }, a => a);
    builder.addOutput(changeAddress as string, changeAmount.amount);

    // sign every input
    const HDNode = await this.keyRepo.getHDNode(id);
    if (!HDNode) {
      throw new Error(`could not retrieve HDNode!`);
    }
    coins.forEach((no, i) => builder.sign(i, HDNode.keyPair));

    this.logger.debug(`going to build ${builder}`);
    return builder.build();
  }

  public async broadCast(tx: Transaction): Promise<void> {
    const hexTx = tx.toHex();
    this.logger.debug(`broadcasting tx ${hexTx}`);
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
        o.amount,
        false,
        0
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
    this.logger.info(`coins inside coinmanager are ${JSON.stringify([...this.coins])}`);
    return null;
  }
}

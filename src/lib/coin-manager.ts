import { BlockchainEvent, BlockchainProxy } from './blockchain-proxy';
import Keystore, { default as KeyRepository } from './key-repository';
import logger from './logger';
import { MyWalletCoin } from './primitives/wallet-coin';
import WalletDB from './wallet-service';
import * as Logger from 'bunyan';
/* tslint:disable-next-line:no-submodule-imports */
import { address, Out, Transaction, TransactionBuilder } from 'bitcoinjs-lib';
import { AccountID } from './primitives/identity';
import { Either, left, right } from 'fp-ts/lib/Either';
import { Outpoint } from 'bitcoin-core';
import * as _ from 'lodash';

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
  public readonly builder: TransactionBuilder;
  public readonly logger: Logger;

  constructor(
    log: Logger,
    public keyRepo: KeyRepository,
    public bchProxy: BlockchainProxy
  ) {
    this.logger = log.child({ subModule: 'CoinManager' });
    this.builder = new TransactionBuilder();
    this.coins = new Map<CoinID, MyWalletCoin>();
    this.logger.info('coinmanager intialized');
  }

  public sign<K extends Keystore>(key: K): boolean {
    return false;
  }

  /**
   * Contextify Transaction output as a WalletCoin and put it into CoinMaps
   * @param {AccountID} id
   * @param {OutpointWithScript[]} outpoints
   * @param {string} txid
   * @returns {WalletCoin[]}
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
    return null;
  }
}

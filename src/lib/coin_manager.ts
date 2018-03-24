import * as btc from 'bitcoinjs-lib';
import { BlockchainProxy } from './blockchain-proxy';
import Keystore from './key-repository';
import logger from './logger';
import { WalletCoin } from './primitives/wallet-coin';
import WalletDB from './wallet-repository';
import * as Logger from 'bunyan';

export default class CoinManager<P extends BlockchainProxy> {
  public readonly bchproxy: P;
  public readonly coins: ReadonlyArray<WalletCoin>;
  public readonly builder: btc.TransactionBuilder;
  public readonly logger: Logger;

  constructor(p: P, log: Logger) {
    this.logger = log.child({ subModule: 'CoinManager' });
    this.builder = new btc.TransactionBuilder();
    this.coins = [];
    this.bchproxy = p;
    this.logger.info('coinmanager intialized');
  }

  /*
  public get lastInternalAddresses(): any {
    return "hoge"
  };
  public get lastExternalAddresses(): any {
    return "fuga"
  };
  public async importSeed (seed: string): Promise<void> {
    return
  };
  public startSync: () => Promise<void>
  public parsePSBT: (Buffer) => Promise<btc.Transaction>;
  */
  public sign<K extends Keystore>(key: K): boolean {
    return false;
  }
}

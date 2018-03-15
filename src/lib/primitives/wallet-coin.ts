import * as btc from 'bitcoinjs-lib';
import { BlockchainProxy } from './blockchain-proxy/trusted-rpc';
import Keystore from './keystore';
import WalletDB from './walletdb';

// Transaction Output with Metadata
// equivalent to ManagedAddress in btcwallet.
export class WalletCoin {
  public readonly scriptType: string;
  public readonly script: Buffer | null; // script necessary for signing Transaction
  public readonly isChange?: boolean;

  public get isMine(): boolean {
    // fetch data from record ...
    return true;
  }

  constructor() {
    this.scriptType = 'nullData';
    this.script = null;
  }
}

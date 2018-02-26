import * as btc from "bitcoinjs-lib"
import {Coin} from "./primitives";
import {BlockchainProxy} from 'blockchain-proxy';
import WalletDB from "./walletdb";
import Keystore from "./keystore";

// Transaction Output with Metadata
// equivalent to ManagedAddress in btcwallet.
class WalletCoin implements Coin {
  public scriptType: string;
  public script: Buffer | null; // script necessary for signing Transaction
  public isChange?: boolean;
  public get isMine (): boolean {
    // fetch data from record ...
    return true
  }
  constructor() {
    this.scriptType = "nullData";
    this.script = null;
  }
}

export default class CoinManager<P extends BlockchainProxy> {
  public proxy: P;
  public coins: WalletCoin[];
  public builder: btc.TransactionBuilder;
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
  };
  constructor (p: P) {
    this.builder = new btc.TransactionBuilder();
    this.coins = [];
    this.proxy = p;
    console.log("coinmanager intialized")
  }
}

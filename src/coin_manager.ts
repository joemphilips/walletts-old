import * as btc from "bitcoinjs-lib"
import {Coin} from "./primitives";
import {BlockchainProxy} from 'blockchain-proxy';
import WalletDB from "./walletdb";
import Keystore from "./keystore";

// Transaction Output with Metadata
// equivalent to ManagedAddress in btcwallet.
class WalletCoin extends Coin {
  public scriptType: btc.scripts.types;
  public script: Buffer; // script necessary for signing Transaction
  public isChange: boolean;
  public get isMine (): boolean {
    // fetch data from record ...
  }
}

export default class CoinManager<P extends BlockchainProxy> {
  walletdb: WalletDB;
  public proxy: P;
  public coins: WalletCoin[];
  public builder: btc.TransactionBuilder;
  public get lastInternalAddresses: any;
  public get lastExternalAddresses: any;
  public async importSeed: (Buffer) => Promise<void>;
  public async startSync: () => Promise<void>
  public async parsePSBT: (Buffer) => Promise<btc.Transaction>;
  public sign<K extends Keystore>(key: K);
}

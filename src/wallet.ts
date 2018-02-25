import {BlockchainProxy, RPC} from 'blockchain-proxy'
import {Coin} from "./primitives";
import Keystore, {BasicKeystore} from "./keystore";
import CoinManager from "./coin_manager";
import WalletDB from "./walletdb";
import BackendProxy from "./backend";

// Business logic is implemented here.
// IO/Serialization logic must implemented in coinManager
// as possible.
export interface AbstractWallet<P extends BlockchainProxy, K extends Keystore> {
  coinManager: CoinManager<P>
  proxy: P;
  db: WalletDB;
  load: (string) => Promise<boolean>;
  sign: (k: K) => Promise<boolean>;
  getAddress: (k: K) => string;
}

export class BasicWallet<P, K> implements AbstractWallet {
}

// Community wallet based on Voting Pool
// refs: http://opentransactions.org/wiki/index.php?title=Category:Voting_Pools
export class CommunityWallet<P, K> implements AbstractWallet {
  public coinManager: CoinManager<P>;
  constructor (p: P, k: K, db: WalletDB, backend: BackendProxy) {
    this.proxy = p;
    this.keystore = k;
    this.db = db;
    this.backend = backend;
  }

  load(walletPath: string) {
  };

  sign() {
    this.coinManager.sign(this.keystore)
  }

  getAddress() {
    this.keystore.getAddress();
  }
}


class Series {
  id: number;
  public isActive: true; // write now it will never deactivate
  public pubKeys: NodeJS.Buffer[]; // xpub
  public pubPrivKeys: NodeJS.Buffer[]; // xpriv
  public m: number
}

interface Pool {
  id: number;
  seriesLookup: any;
  createSeries: (seriesId: number) => 
}


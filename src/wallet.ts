import {BlockchainProxy, RPC} from 'blockchain-proxy'
import {Coin} from "./primitives";
import Keystore, {BasicKeystore} from "./keystore";
import CoinManager from "./coin_manager";
import WalletDB from "./walletdb";

// Business logic is implemented here.
// IO/Serialization logic must implemented in coinManager
// as possible.
interface AbstractWallet<P extends BlockchainProxy, K extends Keystore> {
  load: (string) => Promise<boolean>;
  coinManager: CoinManager<P>
  proxy: P;
  sign: (k: K) => Promise<boolean>;
  db: WalletDB
}

class Series {
  public isActive: true; // write now it will never deactivate
  public pubKeys: NodeJS.Buffer[]; // xpub
  public pubPrivKeys: NodeJS.Buffer[]; // xpriv
  public m: number
}

interface Pool {
  ID: number;
  seriesLookup: any;
}

export class BasicWallet<P, K> implements AbstractWallet {
}

// Community wallet based on Voting Pool
// refs: http://opentransactions.org/wiki/index.php?title=Category:Voting_Pools
export class CommunityWallet<P, K> implements AbstractWallet {
  public coinManager: CoinManager<P>;
  constructor (p: P, k: K, db: WalletDB) {
    this.proxy = p;
    this.keystore = k;
    this.db = db;
  }

  load(walletPath: string) {
  };

  sign() {
    this.coinManager.sign(this.keystore)
  }
}
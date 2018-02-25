import {BlockchainProxy, RPC} from 'blockchain-proxy'
import {Coin} from "./primitives";
import Keystore, {BasicKeystore} from "./keystore";
import CoinManager from "./coin_manager";
import WalletDB from "./walletdb";
import BackendProxyWeb from "./backend/web";
import {EncryptStream, DecryptStream} from "./stream";
import WritableStream = NodeJS.WritableStream;
import {Readable, Writable} from "stream";

// Business logic is implemented here.
// IO/Serialization logic must implemented in coinManager
// as possible.
export abstract class AbstractWallet<P extends BlockchainProxy,
  K extends Keystore,
  W extends Writable = EncryptStream,
  R extends Readable = DecryptStream> {
  abstract coinManager: CoinManager<P>;
  abstract proxy: P;
  abstract db: WalletDB<W, R>;
  public abstract load: (walletPath: string) => Promise<boolean>;
  public abstract sign: (k: K) => Promise<boolean>;
  abstract getAddress: (k: K) => string;
}

export class BasicWallet implements AbstractWallet<RPC, BasicKeystore> {
  constructor (p: RPC, k: BasicKeystore, db: WalletDB<EncryptStream, DecryptStream>, backend: BackendProxyWeb) {
    this.proxy = p;
    this.keystore = k;
    this.db = db;
    this.backend = backend;
    this.coinManager = new CoinManager<RPC>(this.proxy);
  }
  async load(walletPath: string) {
    try {
      await this.db.load(walletPath)
    } catch (e) {
      throw new Error("failed to load Wallet")
    }
  };

  sign() {
    this.coinManager.sign(this.keystore)
  }

  getAddress() {
    this.keystore.getAddress();
  }
}

// Community wallet based on Voting Pool
// refs: http://opentransactions.org/wiki/index.php?title=Category:Voting_Pools
export class CommunityWallet<P, K, EncryptStream, DecryptStream> implements AbstractWallet {
  public coinManager: CoinManager<P>;
  constructor (p: P, k: K, db: WalletDB, backend: BackendProxyWeb) {
    this.proxy = p;
    this.keystore = k;
    this.db = db;
    this.backend = backend;
  }

  async load(walletPath: string) {
    try {
      await this.db.load(walletPath)
    } catch (e) {
      throw new Error("failed to load Wallet")
    }
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
}


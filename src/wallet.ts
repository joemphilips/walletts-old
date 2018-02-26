import {BlockchainProxy, RPC} from 'blockchain-proxy'
import {Coin} from "./primitives";
import Keystore, {BasicKeystore} from "./keystore";
import CoinManager from "./coin_manager";
import WalletDB from "./walletdb";
import BackendProxyWeb from "./backend/web";
import {EncryptStream, DecryptStream} from "./stream";
import WritableStream = NodeJS.WritableStream;
import {Readable, Writable} from "stream";
import BackendProxy from "./backend/node";

// Business logic is implemented here.
// IO/Serialization logic must implemented in coinManager
// as possible.
export abstract class AbstractWallet<
  P extends BlockchainProxy = RPC,
  K extends Keystore = BasicKeystore,
  W extends Writable = EncryptStream,
  R extends Readable = DecryptStream> {
  public abstract coinManager: CoinManager<P>;
  public abstract proxy: P;
  public abstract db: WalletDB<W, R>;
  public abstract load: (walletPath: string) => Promise<void>;
  public abstract pay: () => Promise<void>;
  abstract getAddress: () => string;
}

export interface WalletOpts<P extends BlockchainProxy,K extends Keystore, W extends Writable , R extends Readable> {
  proxy: P;
  keystore: K;
  db: WalletDB<W, R>;
  backend: BackendProxyWeb;
}

export class BasicWallet implements AbstractWallet<RPC, BasicKeystore> {
  public coinManager: CoinManager<RPC>;
  constructor (public proxy: RPC,
               public keystore: BasicKeystore,
               public db: WalletDB<EncryptStream, DecryptStream>,
               public backend: BackendProxyWeb) {
    this.coinManager = new CoinManager<RPC>(this.proxy);
  }
  async load(walletPath: string): Promise<void> {
    try {
      await this.db.load(walletPath)
    } catch (e) {
      throw new Error("failed to load Wallet")
    }
  };
public async pay() { await this.coinManager.sign(this.keystore) }

  getAddress() {
    return this.keystore.getAddress();
  }
}

// Community wallet based on Voting Pool
// refs: http://opentransactions.org/wiki/index.php?title=Category:Voting_Pools
export class CommunityWallet extends BasicWallet {
  constructor (opts: WalletOpts<RPC, BasicKeystore, EncryptStream, DecryptStream>) {
    const {proxy, keystore, db, backend} = opts;
    super(proxy, keystore, db, backend);
  }

  async load(walletPath: string) {
    try {
      await this.db.load(walletPath)
    } catch (e) {
      throw new Error("failed to load Wallet")
    }
  };

}


interface Series {
  id: number;
  isActive: true; // write now it will never deactivate
  pubKeys: Buffer[]; // xpub
  pubPrivKeys: Buffer[]; // xpriv
  m: number
}

interface Pool {
  id: number;
  seriesLookup: any;
}


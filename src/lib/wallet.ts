import WritableStream = NodeJS.WritableStream;
import { Readable, Writable } from 'stream';
import BackendProxy from './backend/node';
import { BlockchainProxy, RPC } from './blockchain-proxy/';
import CoinManager from './coin_manager';
import {
  FailedToCreateWalletError,
  WalletError,
  WalletNotFoundError
} from './errors';
import Keystore, { BasicKeystore } from './keystore';
import logger from './logger';
import { DecryptStream, EncryptStream } from './stream';
import { UIProxy, WalletAction } from '../bin/uiproxy';
import WalletDB from './walletdb';

// Business logic is implemented here.
// IO/Serialization logic must implemented in coinManager
// as possible.
export abstract class AbstractWallet<
  P extends BlockchainProxy = RPC,
  K extends Keystore = BasicKeystore,
  W extends Writable = EncryptStream,
  R extends Readable = DecryptStream
> {
  public abstract readonly coinManager: CoinManager<P>;
  public abstract readonly bchproxy: P;
  public abstract readonly db: WalletDB<W, R>;
  public abstract readonly load: (walletPath: string) => Promise<void>;
  public abstract readonly pay: () => Promise<void>;
  public abstract readonly getAddress: () => string;
  public abstract readonly fromSeed: (seed: ReadonlyArray<string>) => Promise<boolean>;
  public abstract readonly createNew: (nameSpace: string) => Promise<boolean>;
}

export interface WalletOpts<
  P extends BlockchainProxy,
  K extends Keystore,
  W extends Writable,
  R extends Readable
> {
  readonly bchproxy: P;
  readonly keystore: K;
  readonly db: WalletDB<W, R>;
  readonly backend: BackendProxy;
}

export class BasicWallet implements AbstractWallet<RPC, BasicKeystore> {
  public readonly coinManager: CoinManager<RPC>;
  constructor(
    public bchproxy: RPC,
    public keystore: BasicKeystore,
    public db: WalletDB<EncryptStream, DecryptStream>,
    public backend: BackendProxy,
  ) {
    this.coinManager = new CoinManager<RPC>(this.bchproxy);
  }

  public async fromSeed(seed: ReadonlyArray<string>): Promise<boolean> {
    // TODO: rescan
    return false
  }

  public async createNew(nameSpace: string): Promise<boolean> {
    try {
      this.db.create(nameSpace);
    } catch (e) {
      return false
    }
    return true
  }

  public async load(walletPath: string): Promise<void> {
    try {
      await this.db.load(walletPath);
    } catch (e) {
    }
  }
  public async pay(): Promise<void> {
    await this.coinManager.sign(this.keystore);
  }

  public getAddress(): string {
    return this.keystore.getAddress();
  }
}

// Community wallet based on Voting Pool
// refs: http://opentransactions.org/wiki/index.php?title=Category:Voting_Pools
export class CommunityWallet extends BasicWallet {
  constructor(
    opts: WalletOpts<RPC, BasicKeystore, EncryptStream, DecryptStream>
  ) {
    const { bchproxy, keystore, db, backend } = opts;
    super(bchproxy, keystore, db, backend);
  }
}

interface Series {
  readonly id: number;
  readonly isActive: true; // write now it will never deactivate
  readonly pubKeys: ReadonlyArray<Buffer>; // xpub
  readonly pubPrivKeys: ReadonlyArray<Buffer>; // xpriv
  readonly m: number;
}

interface Pool {
  readonly id: number;
  readonly seriesLookup: any;
}

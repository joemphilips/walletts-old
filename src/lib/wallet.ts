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
import Keystore, {BasicKeyRepository, default as KeyRepository} from './key-repository';
import logger from './logger';
import { DecryptStream, EncryptStream } from './stream';
import { UIProxy, WalletAction } from '../bin/uiproxy';
import WalletRepository from './walletdb';
import {AccountID} from "./primitives/identity";

// Business logic is implemented here.
// IO/Serialization logic must implemented in coinManager
// as possible.
export abstract class AbstractWallet<
  P extends BlockchainProxy = RPC
> {
  public abstract readonly coinManager: CoinManager<P>;
  public abstract readonly bchproxy: P;
  public abstract readonly walletRepository: WalletRepository;
  public abstract readonly id: AccountID;
  public abstract readonly load: (walletPath: string) => Promise<void>;
  public abstract readonly pay: (k: Keystore) => Promise<void>;
  public abstract readonly getAddress: (k: Keystore) => string;
  public abstract readonly fromSeed: (seed: ReadonlyArray<string>) => Promise<boolean>;
  public abstract readonly createNew: (nameSpace: string) => Promise<boolean>;
}

export interface WalletOpts<
  P extends BlockchainProxy,
  W extends Writable,
  R extends Readable
> {
  readonly bchproxy: P;
  readonly walletrepository: WalletRepository;
  readonly backend: BackendProxy;
}

export class BasicWallet implements AbstractWallet<RPC> {
  public readonly coinManager: CoinManager<RPC>;
  public readonly id: AccountID;
  constructor(
    public bchproxy: RPC,
    public walletRepository: WalletRepository,
    public backend: BackendProxy,
  ) {
    this.coinManager = new CoinManager<RPC>(this.bchproxy);
    this.id = "walletid" // TODO: refactor
  }

  public async fromSeed(seed: ReadonlyArray<string>): Promise<boolean> {
    // TODO: rescan
    return false
  }

  public async createNew(nameSpace: string): Promise<boolean> {
    try {
      this.walletRepository.create(nameSpace);
    } catch (e) {
      return false
    }
    return true
  }

  public async pay(k: Keystore): Promise<void> {
    await this.coinManager.sign(k);
  }

  public getAddress(k: KeyRepository): string {
    return this.getAddress(this.id, );
  }
}

// Community wallet based on Voting Pool
// refs: http://opentransactions.org/wiki/index.php?title=Category:Voting_Pools
export class CommunityWallet extends BasicWallet {
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

import WritableStream = NodeJS.WritableStream;
import * as uuid from 'node-uuid';
import { Readable, Writable } from 'stream';
import { UIProxy, WalletAction } from '../bin/uiproxy';
import BackendProxy from './backend/node';
import { BlockchainProxy, TustedBitcoindRPC } from './blockchain-proxy/';
import CoinManager from './coin_manager';
import {
  FailedToCreateWalletError,
  WalletError,
  WalletNotFoundError
} from './errors';
import Keystore, {
  BasicKeyRepository,
  default as KeyRepository
} from './key-repository';
import logger from './logger';
import { AccountID } from './primitives/identity';
import { DecryptStream, EncryptStream } from './stream';
import WalletRepository from './wallet-repository';
import * as Logger from 'bunyan';

// Business logic is implemented here.
// IO/Serialization logic must implemented in coinManager
// as possible.
export abstract class AbstractWallet<
  P extends BlockchainProxy = TustedBitcoindRPC
> {
  public abstract readonly coinManager: CoinManager<P>;
  public abstract readonly bchproxy: P;
  public abstract readonly walletRepository: WalletRepository;
  public abstract readonly id: AccountID;
  public abstract readonly pay: (k: Keystore) => Promise<void>;
  public abstract readonly fromSeed: (
    seed: ReadonlyArray<string>
  ) => Promise<boolean>;
  public abstract readonly createNewAcount: (
    nameSpace: string
  ) => Promise<boolean>;
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

export class BasicWallet implements AbstractWallet<TustedBitcoindRPC> {
  public readonly coinManager: CoinManager<TustedBitcoindRPC>;
  public readonly id: AccountID;
  constructor(
    public bchproxy: TustedBitcoindRPC,
    public walletRepository: WalletRepository,
    public backend: BackendProxy,
    public publicKey: Buffer,
    log: Logger
  ) {
    this.coinManager = new CoinManager<TustedBitcoindRPC>(this.bchproxy, log);
    this.id = uuid.v4(); // TODO: derive from public key
  }

  public async fromSeed(seed: ReadonlyArray<string>): Promise<boolean> {
    // TODO: rescan
    return false;
  }

  public async createNewAcount(nameSpace: string): Promise<boolean> {
    throw new WalletError('not implemented');
  }

  public async pay(k: Keystore): Promise<void> {
    await this.coinManager.sign(k);
  }
}

// Community wallet based on Voting Pool
// refs: http://opentransactions.org/wiki/index.php?title=Category:Voting_Pools
export class CommunityWallet extends BasicWallet {}

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

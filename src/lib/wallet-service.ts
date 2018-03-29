import * as fs from 'fs';
import * as bitcoin from 'bitcoinjs-lib';
import * as path from 'path';
import { Readable, Writable } from 'stream';
import { Config } from './config';
import logger from './logger';
import * as Logger from 'bunyan';
import * as rx from 'rxjs';
import { AbstractWallet, BasicWallet } from '../lib/wallet';
import WalletRepository from '../lib/wallet-repository';
import secureRandom from 'secure-random';
import * as bip39 from 'bip39';

/**
 * Make stateless as possible
 */
interface AbstractWalletService<W extends AbstractWallet> {
  load: (repo: WalletRepository, nameSpace: string) => Promise<W>;
  createNew: (nameSpace: string, passPhrase?: string) => Promise<W>;
  createFromSeed: (
    nameSpace: string,
    seed: ReadonlyArray<string>,
    passPhrase: string
  ) => Promise<W>;
}

export default class WalletService extends rx.Subject<any>
  implements AbstractWalletService<BasicWallet> {
  private readonly logger: Logger;
  constructor(private cfg: Config, log: Logger) {
    super();
    this.logger = log.child({ subModule: 'WalletService' });
  }
  public async load(
    repo: WalletRepository,
    nameSpace: string
  ): Promise<BasicWallet> {
    if (fs.statSync(this.cfg.walletDBPath)) {
      throw new Error(
        `No walletDB directory Found in ${this.cfg.walletDBPath}`
      );
    }
    return repo.loadWallet(this.cfg.walletDBPath);
  }

  public async createNew(
    nameSpace: string,
    passPhrase?: string
  ): Promise<BasicWallet> {
    this.logger.trace('creating new wallet ...');
    const node = bitcoin.HDNode.fromSeedBuffer(secureRandom(16, {
      type: 'Buffer'
    }) as Buffer);
    const pubKey = node.getPublicKeyBuffer();
    return new BasicWallet(pubKey, null, this.logger);
  }

  public async createFromSeed(
    nameSpace: string,
    seed: ReadonlyArray<string>,
    passPhrase?: string
  ): Promise<BasicWallet> {
    this.logger.trace('re-creating Wallet from seed...');
    const node = bitcoin.HDNode.fromSeedBuffer(
      bip39.mnemonicToSeed(seed.join(''), passPhrase)
    );
    const pubkey = node.getPublicKeyBuffer();
    return new BasicWallet(pubkey, null, this.logger);
  }
}

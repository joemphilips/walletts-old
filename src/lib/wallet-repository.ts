import * as fs from 'fs';
import * as path from 'path';
import { Readable, Writable } from 'stream';
import { Config } from './config';
import logger from './logger';
import * as Logger from 'bunyan';

export default class WalletRepository {
  private contents: string = '';
  private readonly logger: Logger;
  constructor(private cfg: Config, log: Logger) {
    this.logger = log.child({ subModule: 'WalletRepository' });
  }
  public async load(nameSpace: string): Promise<void> {
    if (fs.statSync(this.cfg.walletDBPath)) {
      throw new Error(
        `No walletDB directory Found in ${this.cfg.walletDBPath}`
      );
    }
    this.contents = fs.readFileSync(this.cfg.walletDBPath, 'utf-8');
    return;
  }

  public async createNew(
    nameSpace: string,
    passPhrase?: string
  ): Promise<boolean> {
    this.logger.error('not implemtented');
    return false;
  }

  public async createFromSeed(
    nameSpace: string,
    seed: ReadonlyArray<string>,
    passPhrase?: string
  ): Promise<boolean> {
    this.logger.error('not implemented!');
    return false;
  }
}

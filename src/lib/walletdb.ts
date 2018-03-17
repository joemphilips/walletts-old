import * as fs from 'fs';
import * as path from 'path';
import { Readable, Writable } from 'stream';
import { Config } from './config';
import logger from './logger';

export default class WalletDB<W extends Writable, R extends Readable> {
  private contents: string = '';
  constructor(private w: W, private r: R, private cfg: Config) {}
  public async load(nameSpace: string): Promise<void> {
    if (fs.statSync(this.cfg.walletDBPath)) {
      throw new Error(
        `No walletDB directory Found in ${this.cfg.walletDBPath}`
      );
    }
    this.contents = fs.readFileSync(this.cfg.walletDBPath, 'utf-8');
    return;
  }

  public async create({
    nameSpace
  }: {
    readonly nameSpace: string;
  }): Promise<boolean> {
    logger.error('not implemtented');
    return false;
  }
}

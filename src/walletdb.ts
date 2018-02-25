import {Readable, Writable} from 'stream'
import * as crypto from 'crypto'
import fs from 'fs';
import path from 'path';
import {Config} from "./config";

export default class WalletDB<W extends NodeJS.WriteStream, R extends NodeJS.ReadableStream> {
  constructor(w: W, r: R, cfg: Config) {
    this.w = w;
    this.r = r;
    this.cfg = cfg
  }
  public async load (nameSpace: string): Promise<void> {
    if (!path.exists(this.cfg.walletDBPath))
      throw new Error(`No walletDB directory Found in ${this.cfg.walletDBPath}`);
    let rstream = fs.createReadStream(this.cfg.walletDBPath);
    rstream
      .pipe(this.r)
  }
}


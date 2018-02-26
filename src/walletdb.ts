import {Readable, Writable} from 'stream'
import * as crypto from 'crypto'
import {Config} from "./config";
const fs = require('fs');
const path = require('path');

export default class WalletDB<W extends Writable, R extends Readable> {
  constructor(private w: W, private r: R, private cfg: Config) {
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


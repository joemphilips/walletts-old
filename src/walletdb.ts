import {Readable, Writable} from 'stream'
import * as crypto from 'crypto'

export default class WalletDB<W extends NodeJS.WriteStream, R extends NodeJS.ReadableStream> {
  constructor(w: W, r: R) {

  }
  public async load (): Promise<void> {

  }
}


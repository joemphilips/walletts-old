import {Readable, Transform, Writable} from 'stream'
const sodium = require('sodium');

// stream for encrypting/decrypting WalletDB data
export class EncryptStream extends Writable {
  private box: any;
  constructor(opts: any) {
    super(opts)
    this.box = new sodium.Box();
  }

  public _write(chunk: Buffer, encoding: string, callback: Function) {
    this.box.encrypt(chunk, encoding)
  }
}

export class DecryptStream extends Readable {

}

export class PSBTParserStream {

}
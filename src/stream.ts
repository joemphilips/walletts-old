import {Readable, Writable} from 'stream'
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

  public end(cb: Function) {
    console.log(`not implemented !`)
  }
}

export class DecryptStream extends Readable {

}

export class PSBTParserStream {

}
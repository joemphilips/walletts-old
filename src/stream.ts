import {Readable, Writable} from 'stream'
import * as sodium from 'sodium'

// stream for encrypting/decrypting WalletDB data
export class EncryptStream extends Writable {
  constructor() {
    this.box = new sodium.Box();
  }

  public _write(chunk, encoding, callback) {
    this.box.encrypt(chunk, encoding)
  }
}

export class DecryptStream extends Readable {

}
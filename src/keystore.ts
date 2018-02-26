import * as btc from 'bitcoinjs-lib'
import {Config} from "./config";

export default interface Keystore{
  getAddress: () => string
}
export class BasicKeystore implements Keystore {
  public HDNode: btc.HDNode;
  constructor (seed? : Buffer) {
    this.HDNode = seed ? btc.HDNode.fromSeedBuffer(seed) : new btc.HDNode(btc.ECPair.makeRandom(), Buffer.alloc(32, 1))
  }
  public getAddress () {
     return this.HDNode.getAddress()
  }
}

/*
export class ExternalKeystore implements Keystore {

}
*/
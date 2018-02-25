import * as btc from 'bitcoinjs-lib'

export default interface Keystore{
  getAddress: () => string
}
export class BasicKeystore implements Keystore {
  public HDNode;
  constructor (seed? : string) {
    this.HDNode = seed ? btc.HDNode.fromSeedBuffer(seed) : new btc.HDNode()
  }
  public getAddress () {
     return this.HDNode.getAddress()
  }
}
export class ExternalKeystore extends Keystore {

}
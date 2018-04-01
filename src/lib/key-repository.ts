import * as btc from 'bitcoinjs-lib';
import { Config } from './config';
import { AccountID } from './primitives/identity';

// KeyRepository work as a visitor pattern mostly for CoinManager
export default interface KeyRepository {
  readonly getAddress: (id: AccountID, hdpath: string) => string | void;
  readonly getPrivKey: (id: AccountID) => string | void;
  readonly setHDNode: (id: AccountID, node: btc.HDNode) => void;
  readonly getHDNode: (id: AccountID) => btc.HDNode | void;
  readonly getPubKey: (id: AccountID) => string | void;
};

export class InMemoryKeyRepository extends Map<AccountID, btc.HDNode>
  implements KeyRepository {
  constructor() {
    super();
  }

  public getAddress(id: AccountID, hdpath: string): string | void {
    const hd = this.get(id);
    if (!hd) {
      return;
    }
    hd.derivePath(hdpath).getAddress();
  }

  public getPrivKey(id: AccountID): string | void {
    const hd = this.get(id);
    if (!hd) {
      return;
    }
    return hd.keyPair.toWIF();
  }

  public setHDNode(id: AccountID, node: btc.HDNode): string | void {
    this.set(id, node);
    return;
  }

  public getPubKey(id: AccountID): string | void {
    const hd = this.get(id);
    if (!hd) {
      return;
    }
    return hd.getPublicKeyBuffer().toString('hex');
  }

  public getHDNode(id: AccountID): btc.HDNode | void {
    return this.get(id);
  }
}

/*
export class ExternalKeyRepository implements KeyRepository {

}
*/

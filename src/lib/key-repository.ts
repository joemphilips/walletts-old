import * as btc from 'bitcoinjs-lib';
import { Config } from './config';
import { AccountID } from './primitives/identity';
/* tslint:disable no-submodule-imports */
import { Either, either, left, right } from 'fp-ts/lib/Either';

// KeyRepository work as a visitor pattern mostly for CoinManager
export default interface KeyRepository {
  readonly getAddress: (
    id: AccountID,
    hdpath: string
  ) => Promise<string | void>;
  readonly getPrivKey: (id: AccountID) => Promise<string | void>;
  readonly setHDNode: (id: AccountID, node: btc.HDNode) => Promise<void>;
  readonly getHDNode: (id: AccountID) => Promise<btc.HDNode | void>;
  readonly getPubKey: (id: AccountID) => Promise<string | void>;
};

export class InMemoryKeyRepository extends Map<AccountID, btc.HDNode>
  implements KeyRepository {
  constructor() {
    super();
  }

  public async getAddress(
    id: AccountID,
    hdpath: string
  ): Promise<string | void> {
    const hd = this.get(id);
    if (!hd) {
      return;
    }
    return hd.derivePath(hdpath).getAddress();
  }

  public async getPrivKey(id: AccountID): Promise<string | void> {
    const hd = this.get(id);
    if (!hd) {
      return;
    }
    return hd.keyPair.toWIF();
  }

  public async setHDNode(id: AccountID, node: btc.HDNode): Promise<void> {
    this.set(id, node);
    return;
  }

  public async getPubKey(id: AccountID): Promise<string | void> {
    const hd = this.get(id);
    if (!hd) {
      return;
    }
    return hd.getPublicKeyBuffer().toString('hex');
  }

  public async getHDNode(id: AccountID): Promise<btc.HDNode | void> {
    return this.get(id);
  }
}

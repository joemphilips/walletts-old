import * as btc from 'bitcoinjs-lib';
import { Config } from './config';
import KeyDB, { InMemoryDB } from './keydb';
import { AccountID } from './primitives/identity';

// KeyRepository work as a visitor pattern mostly for CoinManager
export default interface KeyRepository {
  readonly getAddress: (id: AccountID, hdpath: string) => string | void;
};

export class BasicKeyRepository implements KeyRepository {
  constructor(private keyCryptpDB: InMemoryDB) {}

  public getAddress(id: AccountID, hdpath: string): string | void {
    const hd = this.keyCryptpDB.get(id);
    if (!hd) {
      return;
    }
    hd.derivePath(hdpath).getAddress();
  }
}

/*
export class ExternalKeyRepository implements KeyRepository {

}
*/

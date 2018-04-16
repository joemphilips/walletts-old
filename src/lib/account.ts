import { AccountID } from './primitives/identity';
import { Satoshi } from './primitives/balance';
import { MyWalletCoin } from './primitives/wallet-coin';
/* tslint:disable:no-submodule-imports */
import { none, Option, some } from 'fp-ts/lib/Option';
import { Either, left, right } from 'fp-ts/lib/Either';
import { Subject, Observable } from '@joemphilips/rxjs';
import {
  BlockchainEvent,
  getObservableBlockchain,
  ObservableBlockchain
} from './blockchain-proxy';
import { address, Block, Out, Transaction } from 'bitcoinjs-lib';
import CoinManager from './coin-manager';
import { isOtherUser, OtherUser, OuterEntity } from './primitives/entities';

export enum AccountType {
  Normal
}

/**
 * The most important domain object for managing users funds.
 * Modeled as Immutable structure since those Accounts used by several people might verify
 * others signature in different process.
 */
export interface Account extends Observable<any> {
  readonly id: AccountID;
  readonly hdIndex: number;
  readonly type: AccountType;
  readonly coinManager: CoinManager;
  readonly observableBlockchain: ObservableBlockchain;
  readonly balance: Satoshi;
  readonly watchingAddresses: Option<ReadonlyArray<string>>;
  readonly beg: (begTo: OuterEntity) => Promise<any>;
}

type AccountEvent = 'pay' | 'credit';

/**
 * This class must communicate with the blockchain only in reactive manner using ObservableBlockchain, not proactively.
 * Query to the blockchain must be delegated to CoinManager.
 */
export class NormalAccount extends Observable<AccountEvent> implements Account {
  constructor(
    public id: AccountID,
    public hdIndex: number,
    public coinManager: CoinManager,
    public observableBlockchain: ObservableBlockchain,
    public type = AccountType.Normal,
    public balance = Satoshi.fromNumber(0).value as Satoshi,
    public watchingAddresses: Option<ReadonlyArray<string>> = none
  ) {
    super();
    this.observableBlockchain.subscribe(this._handleUpdate.bind(this));
  }

  public async beg(begTo: OuterEntity): Promise<any> {
    if (begTo.kind !== 'otherUser') {
      throw new Error('Normal Account can only beg to other user!');
    }
    return;
  }

  private _handleUpdate(payload: BlockchainEvent): void {
    if (!this || !this.watchingAddresses) {
      /* tslint:disable-next-line */
      console.log(`could not find watching address in ${this.id}`);
      return;
    }
    if (payload instanceof Transaction) {
      // check if incoming transaction is concerned to this account.
      /* tslint:disable-next-line */
      console.log(`lets see txs address is in ${this.watchingAddresses} ...`);

      const matchedOuts: Out[] = payload.outs.filter(o =>
        this.watchingAddresses.map(ourAddresses =>
          ourAddresses.some(a => a === address.fromOutputScript(o.script))
        )
      );
      if (!matchedOuts) {
        return;
      }

      const outpointWithScriptandAmount = matchedOuts.map(o => {
        const index = payload.outs.indexOf(o);
        return {
          id: payload.getId(),
          index,
          scriptPubKey: payload.outs[index].script,
          amount: payload.outs[index].value
        };
      });
      this.coinManager
        .importOurOutPoints(this.id, outpointWithScriptandAmount)
        .then(() => this.publish())
        .catch(e => {
          this.publish();
        });
    }
  }
}

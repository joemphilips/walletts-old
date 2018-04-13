import { AccountID } from './primitives/identity';
import { Balance } from './primitives/balance';
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
import { OtherUser, OuterEntity } from './primitives/entities';

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
  readonly balance: Balance;
  readonly watchingAddresses: Option<ReadonlyArray<string>>;
  readonly pay: (amount: number, destinations: ReadonlyArray<OuterEntity>) => Promise<any>; // TODO: this should not return any.
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
    public balance = new Balance(0),
    public watchingAddresses: Option<ReadonlyArray<string>> = none
  ) {
    super();
    this.observableBlockchain.subscribe(this._handleUpdate.bind(this));
  }

  public async pay(
    amount: number,
    destinations: ReadonlyArray<OtherUser>
  ): Promise<NormalAccount> {
    const nextAmount = this.balance.amount - amount;
    if (nextAmount < 0) {
      throw new Error(`Balance can not be negative!`);
    }
    const newBalance = new Balance(nextAmount);
    const coins = await this.coinManager.chooseCoinsFromAmount(amount);
    const addressAndAmounts = destinations.map(
      (d: OtherUser, i) => ({ address: d.nextAddressToPay, amount})
      );
    this.coinManager.crateTx(coins, addressAndAmounts).map(
      (tx: Transaction) => this.coinManager
        .broadCast(tx)
        .catch(e => `Failed to broadcast TX! the error was ${e.toString()}`)
    );
    return new NormalAccount(
      this.id,
      this.hdIndex,
      this.coinManager,
      this.observableBlockchain,
      this.type,
      newBalance,
      this.watchingAddresses
    );
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

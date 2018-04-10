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
import { Outpoint } from 'bitcoin-core';

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
  readonly coins: Option<ReadonlyArray<MyWalletCoin>>;
  readonly observableBlockchain: ObservableBlockchain;
  readonly balance: Balance;
  readonly watchingAddresses: Option<ReadonlyArray<string>>;
  readonly debit: (coin: MyWalletCoin[]) => Either<Error, Account>;
  readonly credit: (coin: MyWalletCoin[]) => Account;
}

type AccountEvent = 'debit' | 'credit';

/**
 * This class must communicate with the blockchain only in reactive manner using ObservableBlockchain, not proactively.
 * quering to the blockchain must be delegated to CoinManager.
 */
export class NormalAccount extends Observable<AccountEvent> {
  constructor(
    public id: AccountID,
    public hdIndex: number,
    public coinManager: CoinManager,
    public observableBlockchain: ObservableBlockchain,
    public coins: Option<ReadonlyArray<MyWalletCoin>>,
    public type = AccountType.Normal,
    public balance = new Balance(0),
    public watchingAddresses: Option<ReadonlyArray<string>> = none
  ) {
    super();
    this.observableBlockchain.subscribe(this._handleUpdate);
  }

  public debit(coin: MyWalletCoin[]): Either<Error, NormalAccount> {
    const totalAmount = coin
      .map(c => c.amount.amount)
      .reduce((a, b) => a + b, 0);
    const nextAmount = this.balance.amount - totalAmount;
    if (nextAmount) {
      return left(new Error(`Balance can not be negative!`));
    }
    const newBalance = new Balance(nextAmount);
    const coins = this.coins.map(l => [...l, ...coin]);
    return right(
      new NormalAccount(
        this.id,
        this.hdIndex,
        this.coinManager,
        this.observableBlockchain,
        coins,
        this.type,
        newBalance,
        this.watchingAddresses
      )
    );
  }

  public credit(coin: MyWalletCoin[]): NormalAccount {
    const totalAmount = coin
      .map(c => c.amount.amount)
      .reduce((a, b) => a + b, 0);
    const newBalance = new Balance(this.balance.amount + totalAmount);
    const coins = this.coins.map(l =>
      l.filter(c => coin.some(newCoin => newCoin === c))
    );
    return new NormalAccount(
      this.id,
      this.hdIndex,
      this.coinManager,
      this.observableBlockchain,
      coins,
      this.type,
      newBalance,
      this.watchingAddresses
    );
  }

  private _handleUpdate(payload: BlockchainEvent): void {
    if (payload instanceof Transaction) {
      // check if incoming transaction is concerned to this account.
      const matchedOuts: Out[] = payload.outs.filter((o, i) =>
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

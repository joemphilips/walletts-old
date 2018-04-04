import { AccountID } from './primitives/identity';
import { Balance } from './primitives/balance';
import { WalletCoin } from './primitives/wallet-coin';
/* tslint:disable-next-line:no-submodule-imports */
import { Option, some } from 'fp-ts/lib/Option';
/* tslint:disable-next-line:no-submodule-imports */
import { Either, left, right } from 'fp-ts/lib/Either';

export enum AccountType {
  Normal
}

export interface Account {
  readonly id: AccountID;
  readonly hdIndex: number;
  readonly type: AccountType;
  readonly coins: Option<ReadonlyArray<WalletCoin>>;
  readonly balance: Balance;
  readonly debit: (coin: WalletCoin[]) => Either<Error, Account>;
  readonly credit: (coin: WalletCoin[]) => Account;
}

export class NormalAccount {
  constructor(
    public id: AccountID,
    public hdIndex: number,
    public coins: Option<ReadonlyArray<WalletCoin>>,
    public type = AccountType.Normal,
    public balance = new Balance(0)
  ) {}

  public debit(coin: WalletCoin[]): Either<Error, NormalAccount> {
    const totalAmount = coin.reduce((a, b) => a + b.amount, 0);
    const nextAmount = this.balance.amount - totalAmount;
    if (nextAmount) {
      return left(new Error(`Balance can not be negative!`));
    }
    const newBalance = new Balance(nextAmount);
    const coins = this.coins.map(l => [...l, ...coin]);
    return right(
      new NormalAccount(this.id, this.hdIndex, coins, this.type, newBalance)
    );
  }

  public credit(coin: WalletCoin[]): NormalAccount {
    const totalAmount = coin.reduce((a, b) => a + b.amount, 0);
    const newBalance = new Balance(this.balance.amount + totalAmount);
    const coins = this.coins.map(l =>
      l.filter(c => coin.some(newCoin => newCoin === c))
    );
    return new NormalAccount(
      this.id,
      this.hdIndex,
      coins,
      this.type,
      newBalance
    );
  }
}

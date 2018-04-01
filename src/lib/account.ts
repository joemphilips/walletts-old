import { AccountID } from './primitives/identity';
import { Balance } from './primitives/balance';

export type AccountType = 'Normal';

export interface Account {
  readonly id: AccountID;
  readonly type: AccountType;
  readonly balance: Balance;
  readonly debit: (address: string, amount: number) => Account;
  readonly credit: (amount: number) => Account;
}

export class NormalAccount {
  constructor(
    public id: AccountID,
    public type = 'Normal',
    public balance = new Balance(0)
  ) {}

  public debit(address: string, amount: number): NormalAccount {
    const newBalance = new Balance(this.balance.amount - amount);
    return new NormalAccount(this.id, this.type, newBalance);
  }

  public credit(amount: number): NormalAccount {
    const newBalance = new Balance(this.balance.amount + amount);
    return new NormalAccount(this.id, this.type, newBalance);
  }
}

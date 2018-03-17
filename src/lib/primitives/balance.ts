import { Record } from 'immutable';
import { BalanceError, WalletError } from '../errors';

const balance = {
  Amount: 0.0
};

const maxSatoshi = 21 * 1e14;

// TODO: Use range type definition(https://github.com/Microsoft/TypeScript/issues/15480)
// write now it is not implemented to tsc
export class Balance {
  constructor(public readonly amount: number) {}

  public debit(delta: number): Balance {
    if (this.amount < delta) {
      throw new BalanceError('Balance can not be negative!');
    }
    return new Balance(this.amount - delta);
  }

  public credit(delta: number): Balance {
    if (this.amount + delta < maxSatoshi) {
      throw new BalanceError(`Balance could not exceed ${maxSatoshi} !`);
    }
    return new Balance(this.amount + delta);
  }
}

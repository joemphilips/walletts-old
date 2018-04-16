/* tslint:disable: no-submodule-imports */
import { Either, left, right } from 'fp-ts/lib/Either';
import { BalanceError } from '../errors';

const balance = {
  Amount: 0.0
};

export const MAX_SATOSHI = 21 * 1e14;

// TODO: Use range type definition(https://github.com/Microsoft/TypeScript/issues/15480). right now This is not implemented for TS
/**
 * Immutable class to hold the amount a money in satoshi.
 */
export class Satoshi {
  public static fromBTC(btc: number): Either<BalanceError, Satoshi> {
    const satoshiNum = parseFloat(btc.toFixed(9));
    return Satoshi.fromNumber(satoshiNum);
  }

  public static fromNumber(satoshi: number): Either<BalanceError, Satoshi> {
    if (satoshi < 0) {
      return left(new BalanceError(`${satoshi} satoshi can not be negative!`));
    } else if (MAX_SATOSHI < satoshi) {
      return left(
        new BalanceError(`Satoshi ${satoshi} can not exceed ${MAX_SATOSHI}`)
      );
    }
    return right(new Satoshi(satoshi));
  }

  public readonly amount: number;
  private constructor(satoshi: number) {
    /* tslint:disable-next-line */
    this.amount = satoshi;
  }

  public debit(delta: Satoshi): Either<BalanceError, Satoshi> {
    if (this.amount < delta.amount) {
      return left(new BalanceError('Satoshi can not be negative!'));
    }
    return right(new Satoshi(this.amount - delta.amount));
  }

  public credit(delta: Satoshi): Either<BalanceError, Satoshi> {
    if (MAX_SATOSHI < this.amount + delta.amount) {
      return left(
        new BalanceError(`Balance could not exceed ${MAX_SATOSHI} !`)
      );
    }
    return right(new Satoshi(this.amount + delta.amount));
  }

  public toBTC(): number {
    return parseFloat((this.amount / 10000000.0).toFixed(9));
  }
}

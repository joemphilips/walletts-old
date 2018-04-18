import CoinManager from './coin-manager';
import { AccountID, WalletID } from './primitives/identity';
import * as Logger from 'bunyan';
import { crypto } from 'bitcoinjs-lib';
import { Account, NormalAccount } from './account';
/* tslint:disable-next-line  */
import { Observable } from '@joemphilips/rxjs';

export abstract class AbstractWallet {
  public abstract readonly id: AccountID;
  public abstract readonly accounts: ReadonlyArray<Account> | null;
}

interface WalletEvent {
  kind: 'Created';
}

/**
 * Aggregate Root
 */
export class BasicWallet extends Observable<WalletEvent>
  implements AbstractWallet {
  private readonly logger: Logger | null;
  constructor(
    public readonly id: WalletID,
    public readonly accounts: ReadonlyArray<Account> = [],
    public parentLogger?: Logger
  ) {
    super();
    this.logger = parentLogger
      ? parentLogger.child({ subModule: 'BasicWallet' })
      : null;
  }
}

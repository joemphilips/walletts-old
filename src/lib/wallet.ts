import { AccountID, WalletID } from './primitives/identity';
import * as Logger from 'bunyan';
import { Account, NormalAccount } from './account';
/* tslint:disable-next-line  */
import { Subject } from '@joemphilips/rxjs';
import { WalletEvent } from './actions/wallet-event';

export type AccountMap = Map<AccountID, Account>;
export abstract class AbstractWallet {
  public abstract readonly id: AccountID;
  public abstract readonly accounts: AccountMap;
}

export type NormalAccountMap = Map<AccountID, NormalAccount>;

/**
 * Aggregate Root
 */
export class BasicWallet extends Subject<WalletEvent>
  implements AbstractWallet {
  private readonly logger: Logger;
  constructor(
    public readonly id: WalletID,
    readonly parentLogger: Logger,
    public readonly accounts: NormalAccountMap = new Map()
  ) {
    super();
    this.logger = parentLogger.child({ subModule: 'BasicWallet' });
  }
}

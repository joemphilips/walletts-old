import CoinManager from './coin-manager';
import { AccountID, WalletID } from './primitives/identity';
import * as Logger from 'bunyan';
import { crypto } from 'bitcoinjs-lib';
import { Account, NormalAccount } from './account';
/* tslint:disable-next-line  */
import {Observable, Subject} from '@joemphilips/rxjs';
import {DomainEvent} from "./primitives/event";

type AccountMap = Map<AccountID, Account>
export abstract class AbstractWallet {
  public abstract readonly id: AccountID;
  public abstract readonly accounts: AccountMap
}

interface WalletCreatedEvent extends DomainEvent {
  type: 'walletCreated';
  payload: { id: string }
}

type WalletEvent = WalletCreatedEvent
type NormalAccountMap = Map<AccountID, NormalAccount>

/**
 * Aggregate Root
 */
export class BasicWallet extends Subject<WalletEvent>
  implements AbstractWallet {
  private readonly logger: Logger | null;
  constructor(
    public readonly id: WalletID,
    public readonly accounts: NormalAccountMap = new Map(),
    readonly parentLogger: Logger
  ) {
    super();
    this.logger = parentLogger.child({ subModule: 'BasicWallet' })
  }
}

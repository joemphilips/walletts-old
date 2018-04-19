import { AccountID } from './primitives/identity';
import { Satoshi } from './primitives/satoshi';
import { MyWalletCoin } from './primitives/wallet-coin';
/* tslint:disable:no-submodule-imports */
import { none, Option, some } from 'fp-ts/lib/Option';
import { Either, left, right } from 'fp-ts/lib/Either';
import { Subject, Observable } from '@joemphilips/rxjs';
import {
  BlockchainEvent,
  ObservableBlockchain,
  prepareOutpointForImport
} from './blockchain-proxy';
import { address, Block, Out, Transaction } from 'bitcoinjs-lib';
import CoinManager from './coin-manager';
import { isOtherUser, OtherUser, OuterEntity } from './primitives/entities';
import Logger = require('bunyan');
import { DomainEvent } from './primitives/event';

export enum AccountType {
  Normal
}

/**
 * The most important domain entity for managing users funds.
 * It is responsible for
 * 1. Holding balance in a user-interested way.
 *  * Intuitively, a accounts balance can be represented as a total amount of the WalletCoins in CoinManager.
 *  * But this may not the case sometime (e.g. When received a payment, balance should be immediately increase even
 *   it ends up as a double spend.). So instead it returns a balance in business-logic-compatible way
 * 2. It works as an subscribable which translates blockchain event to domain event.
 *
 * Make it as immutable as possible, and should have less method as possible.
 * Ideally it should be an algebraic data type.
 */
export interface Account extends Observable<any> {
  /**
   * Usually created from it's master public key.
   */
  readonly id: AccountID;
  /**
   * The hierarchy in the HD Wallet. Works as `account number` in the wallet.
   */
  readonly hdIndex: number;
  /**
   * account can have different feature depending and it's usage. Which can be distinguish by its `type`.
   */
  readonly type: AccountType;
  /**
   * Takes care of handling coins and signing etc.
   */
  readonly coinManager: CoinManager;
  /**
   * Account must subscribe to this to be aware of the world state (the blockchain).
   */
  readonly observableBlockchain: ObservableBlockchain;
  /**
   * A total BTC amount this account holds.
   */
  readonly balance: Satoshi;
  /**
   * Addresses which this account interested in. Usually these are addresses created by the account itself.
   * But it can be anything depending on the accounts feature. (e.g. community wallet must watch on P2WSH address)
   * TODO: this should be Set() instead of array.
   */
  readonly watchingAddresses: Option<ReadonlyArray<string>>;
  readonly logger: Logger;
}

// Action creators
export const watchingAdddressUpdated = (
  addr: string
): WatchingAddressUpdatedEvent => ({
  type: 'watchingAddressUpdated',
  payload: { address: addr }
});
export const accountCreated = (a: Account): AccountCreatedEvent => ({
  type: 'accountCreated',
  payload: { id: a.id }
});
export const credit = (amount: Satoshi): CreditEvent => ({
  type: 'credit',
  payload: { amount }
});
export const debit = (amount: Satoshi): DebitEvent => ({
  type: 'debit',
  payload: { amount }
});

interface WatchingAddressUpdatedEvent extends DomainEvent {
  type: 'watchingAddressUpdated';
  payload: { address: string };
}
interface AccountCreatedEvent extends DomainEvent {
  type: 'accountCreated';
  payload: { id: AccountID };
}
interface CreditEvent extends DomainEvent {
  type: 'credit';
  payload: { amount: Satoshi };
}
interface DebitEvent extends DomainEvent {
  type: 'debit';
  payload: { amount: Satoshi };
}
type NormalAccountEvent =
  | WatchingAddressUpdatedEvent
  | AccountCreatedEvent
  | CreditEvent
  | DebitEvent;

const handleError = (l: Logger) => (e: any) => {
  l.error(`received error from Observabble ${e}`);
};
/**
 * This class must communicate with the blockchain only in reactive manner using ObservableBlockchain, not proactively.
 * Query to the blockchain must be delegated to CoinManager.
 * TODO: consider using specific kind of Subject (e.g. BehaviorSubject)
 */
export class NormalAccount extends Subject<NormalAccountEvent>
  implements Account {
  public readonly logger: Logger;
  constructor(
    public readonly id: AccountID,
    public readonly hdIndex: number,
    public readonly coinManager: CoinManager,
    public readonly observableBlockchain: ObservableBlockchain,
    logger: Logger,
    public readonly type = AccountType.Normal,
    public readonly watchingAddresses: Option<ReadonlyArray<string>> = none
  ) {
    super();
    this.logger = logger.child({ account: this.id });
    this.observableBlockchain.subscribe(
      this._handleUpdate.bind(this),
      handleError(this.logger)
    );
    this.publish();
  }

  public get balance(): Satoshi {
    return this.coinManager.total;
  }

  // TODO: this can be a pure function outside of this class.
  private _handleUpdate(payload: BlockchainEvent): void {
    if (!this || !this.watchingAddresses) {
      /* tslint:disable-next-line */
      console.log(`could not find watching address in ${this.id}`);
      return;
    }
    if (payload instanceof Transaction) {
      // check if incoming transaction is concerned to this account.
      const matchedOuts: Out[] = payload.outs.filter(o =>
        this.watchingAddresses.map(ourAddresses =>
          ourAddresses.some(a => a === address.fromOutputScript(o.script))
        )
      );
      if (!matchedOuts) {
        return;
      }

      const outpointWithScriptandAmount = matchedOuts.map(
        prepareOutpointForImport(payload)
      );
      const totalIn = outpointWithScriptandAmount
        .map(o => o.amount)
        .reduce((a, b) => a.chain(s => s.credit(b)), Satoshi.fromNumber(0))
        .fold(e => {
          throw e;
        }, r => r);
      this.coinManager
        .importOurOutPoints(this.id, outpointWithScriptandAmount)
        .then(() => this.next(credit(totalIn)))
        .catch(this.error);
    }
  }
}

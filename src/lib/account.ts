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

export enum AccountType {
  Normal
}

/**
 * The most important domain entity for managing users funds.
 * Modeled as Immutable structure since those Accounts used by several people might verify
 * others signature in different process.
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
): watchingAddressUpdatedEvent => ({
  type: 'WatchingAddressUpdated',
  payload: { address: addr }
});
export const accountCreated = (a: Account): accountCreatedEvent => ({
  type: 'accountCreated',
  payload: { id: a.id }
});
export const credit = (amount: Satoshi): creditEvent => ({
  type: 'credit',
  payload: { amount }
});
export const debit = (amount: Satoshi): debitEvent => ({
  type: 'debit',
  payload: { amount }
});

/* tslint:disable interface-over-type-literal */
type watchingAddressUpdatedEvent = {
  type: 'WatchingAddressUpdated';
  payload: { address: string };
};
type accountCreatedEvent = {
  type: 'accountCreated';
  payload: { id: AccountID };
};
type creditEvent = { type: 'credit'; payload: { amount: Satoshi } };
type debitEvent = { type: 'debit'; payload: { amount: Satoshi } };
type NormalAccountEvent =
  | watchingAddressUpdatedEvent
  | accountCreatedEvent
  | creditEvent
  | debitEvent;

const handleError = (l: Logger) => (e: any) => {
  l.error(`received error from Observabble ${e}`);
};
/**
 * This class must communicate with the blockchain only in reactive manner using ObservableBlockchain, not proactively.
 * Query to the blockchain must be delegated to CoinManager.
 */
export class NormalAccount extends Subject<NormalAccountEvent>
  implements Account {
  public logger: Logger;
  constructor(
    public id: AccountID,
    public hdIndex: number,
    public coinManager: CoinManager,
    public observableBlockchain: ObservableBlockchain,
    logger: Logger,
    public type = AccountType.Normal,
    public watchingAddresses: Option<ReadonlyArray<string>> = none
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

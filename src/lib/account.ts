import { AccountID } from './primitives/identity';
import { Satoshi } from './primitives/satoshi';
/* tslint:disable:no-submodule-imports */
import { none, Option } from 'fp-ts/lib/Option';
import { Observable, Subject } from '@joemphilips/rxjs';
import {
  BlockchainEvent,
  ObservableBlockchain,
  prepareOutpointForImport
} from './blockchain-proxy';
import { address, Out, Transaction } from 'bitcoinjs-lib';
import CoinManager from './coin-manager';
import { credit, NormalAccountEvent } from './actions/account-event';
import Logger = require('bunyan');

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
export interface Account extends Subject<any> {
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

const handleError = (l: Logger) => (e: any) => {
  l.error(`received error from Observabble ${e}`);
};

const handleUpdate = (log: Logger) => (id: AccountID) => (
  watchingAddresses: ReadonlyArray<string>
) => (coinManager: CoinManager) => (
  nextSubject: Subject<NormalAccountEvent>
) => (payload: BlockchainEvent): void => {
  // Equivalent to CWallet::SyncTransaction in the bitcoin core.
  if (payload instanceof Transaction) {
    // check if incoming transaction is concerned to this account.
    const matchedOuts: Out[] = payload.outs.filter(o =>
      watchingAddresses.some(a => a === address.fromOutputScript(o.script))
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
    coinManager
      .importOurOutPoints(id, outpointWithScriptandAmount)
      .then(() => log.info(`finished importing aomunts from the blockchain`))
      .then(() => nextSubject.next(credit(totalIn)))
      .catch(() => nextSubject.error(`error while importing to coinManager`));
  } else {
    throw new Error(`Not supported yet!`);
  }
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
      handleUpdate(this.logger)(id)(this.watchingAddresses.getOrElse([]))(
        this.coinManager
      )(this),
      handleError(this.logger)
    );
    this.publish();
  }

  public get balance(): Satoshi {
    return this.coinManager.total;
  }
}

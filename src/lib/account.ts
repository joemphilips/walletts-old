import { AccountID } from './primitives/identity';
import { Satoshi } from './primitives/satoshi';
/* tslint:disable:no-submodule-imports */
import { none, Option } from 'fp-ts/lib/Option';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subject
} from '@joemphilips/rxjs';
import {
  BlockchainEvent,
  ObservableBlockchain,
  prepareOutpointForImport
} from './blockchain-proxy';
import { address, Out, Transaction } from 'bitcoinjs-lib';
import CoinManager from './coin-manager';
import { credit, NormalAccountEvent } from './actions/account-event';
import Logger = require('bunyan');
import { Either } from 'fp-ts/lib/Either';

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

const handleIncomingEvent = (log: Logger) => (
  a: Account,
) => (payload: BlockchainEvent): void => {
  if (payload instanceof Transaction) {
    handleIncomingTx(
      payload,
      a.watchingAddresses.getOrElse([]),
      a.coinManager,
      a,
      log
    );
  } else {
    throw new Error(`Not supported yet!`);
  }
};

const handleIncomingTx = (
  payload: Transaction,
  watchingAddresses: ReadonlyArray<string>,
  coinManager: CoinManager,
  account: NormalAccount,
  log: Logger
) => {
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
    .importOurOutPoints(account.id, outpointWithScriptandAmount)
    .then(() => log.info(`finished importing aomunts from the blockchain`))
    .then(() => account.next(credit(totalIn)))
    .catch(() => account.error(`error while importing to coinManager`));
};

export const subscribeToBlockchain = (
  a: Account,
  infoSource: ObservableBlockchain,
  logger: Logger
): Account => {
  const subsc = infoSource.subscribe(
    handleIncomingEvent(logger)(a),
    handleError(logger),
    () =>
      logger.error(
        `received onCompleted event from the Blockchain which should not happen`
      )
  );
  return a;
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
    logger: Logger,
    public readonly type = AccountType.Normal,
    public readonly watchingAddresses: Option<ReadonlyArray<string>> = none
  ) {
    super();
    this.logger = logger.child({ account: this.id });
    this.publish();
  }

  public get balance(): Satoshi {
    return this.coinManager.total;
  }
}

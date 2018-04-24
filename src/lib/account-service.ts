import {
  Account,
  AccountType,
  NormalAccount,
  subscribeToBlockchain
} from './account';
import KeyRepository, { InMemoryKeyRepository } from './key-repository';
import { crypto, HDNode, Transaction } from 'bitcoinjs-lib';
import hash160 = crypto.hash160;
/* tslint:disable-next-line:no-submodule-imports */
import { none, some } from 'fp-ts/lib/Option';
import * as Logger from 'bunyan';
import { AccountID } from './primitives/identity';
import { BlockchainProxy, ObservableBlockchain } from './blockchain-proxy';
import CoinManager from './coin-manager';
import { isOtherUser, OuterEntity } from './primitives/entities';
import { Satoshi } from './primitives/satoshi';
import {
  accountCreated,
  debit,
  watchingAdddressUpdated
} from './actions/account-event';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import { Either, left } from 'fp-ts/lib/Either';
import { Task } from 'fp-ts/lib/Task';

export interface AbstractAccountService<A extends Account> {
  readonly keyRepo: KeyRepository;
  getAddressForAccount: (
    a: A,
    observableBlockchain: ObservableBlockchain,
    index: number
  ) => Promise<[A, string, string]>;
  createFromHD: (
    masterHD: HDNode,
    index: number,
    observableBlockchain: ObservableBlockchain,
    bchProxy: BlockchainProxy
  ) => Promise<A>;
  pay: (
    from: A,
    amount: Satoshi,
    destinations: ReadonlyArray<OuterEntity>,
    observableBlockchain: ObservableBlockchain
  ) => Promise<A>;
}

export default class NormalAccountService
  implements AbstractAccountService<NormalAccount> {
  private readonly logger: Logger;
  constructor(parentLogger: Logger, public readonly keyRepo: KeyRepository) {
    this.logger = parentLogger.child({ subModule: 'NormalAccountService' });
  }

  public async pay(
    from: NormalAccount,
    amount: Satoshi,
    destinations: ReadonlyArray<OuterEntity>,
    observableBlockchain: ObservableBlockchain
  ): Promise<NormalAccount> {
    if (destinations.some(d => !isOtherUser(d))) {
      throw new Error(`Right now, only paying to other Users is supported`);
    }

    const coins = await from.coinManager.pickCoinsForAmount(amount);
    const addressAndAmounts = destinations.map((d: OuterEntity, i) => ({
      address: d.nextAddressToPay,
      amountInSatoshi: amount
    }));

    const [updatedAccount, _, changeAddress] = await this.getAddressForAccount(
      from,
      observableBlockchain
    );
    const txResult = await from.coinManager.createTx(
      from.id,
      coins,
      addressAndAmounts,
      changeAddress
    );
    updatedAccount.coinManager
      .broadCast(txResult)
      .then(() => updatedAccount.next(debit(amount)))
      .catch(
        (e: Error) => `Failed to broadcast TX! the error was ${e.toString()}`
      );
    return new NormalAccount(
      updatedAccount.id,
      updatedAccount.hdIndex,
      updatedAccount.coinManager,
      this.logger,
      updatedAccount.type,
      updatedAccount.watchingAddresses
    );
  }

  /**
   * TODO: make less anemic by using Kleisli composition
   * @param {NormalAccount} a
   * @param {ObservableBlockchain} observableBlockchain
   * @param {number} index
   * @returns {Promise<[NormalAccount , string , string]>}
   */
  public async getAddressForAccount(
    a: NormalAccount,
    observableBlockchain: ObservableBlockchain,
    index?: number
  ): Promise<[NormalAccount, string, string]> {
    const nextAddreessindex = index
      ? index
      : a.watchingAddresses.getOrElse([]).length;
    this.logger.trace(`going to get address for Account ${a.id}`);
    const address = await this.keyRepo.getAddress(
      a.id,
      `0/${nextAddreessindex}`
    );
    const changeAddress = await this.keyRepo.getAddress(
      a.id,
      `1/${nextAddreessindex}`
    );
    if (!address || !changeAddress) {
      this.logger.error(
        `getAddressForAccount failed! repo was ${JSON.stringify(this.keyRepo)}`
      );
      throw new Error(
        `could not retrieve address! This account is not saved to repo!`
      );
    }
    const newAccount = subscribeToBlockchain(
      new NormalAccount(
        a.id,
        a.hdIndex,
        a.coinManager,
        this.logger,
        AccountType.Normal,
        some([...a.watchingAddresses.getOrElse([]), address, changeAddress])
      ),
      observableBlockchain,
      this.logger
    );
    newAccount.next(watchingAdddressUpdated(address));
    newAccount.next(watchingAdddressUpdated(changeAddress));
    return [newAccount, address, changeAddress];
  }

  /**
   * create new account from HDNode.
   * It tries to recover the balance from the blockchain.
   * but before tring, it will simply returns the account first.
   * @param {HDNode} masterHD
   * @param {number} index
   * @param {ObservableBlockchain} observableBlockchain
   * @param {BlockchainProxy} bchProxy
   * @returns {Promise<NormalAccount>}
   */
  public async createFromHD(
    masterHD: HDNode,
    index: number,
    observableBlockchain: ObservableBlockchain,
    bchProxy: BlockchainProxy
  ): Promise<NormalAccount> {
    const pubkey = masterHD.deriveHardened(index).getPublicKeyBuffer();
    const id = hash160(pubkey).toString('hex');
    const coinManager = new CoinManager(this.logger, this.keyRepo, bchProxy);
    this.logger.debug(`Account ${id} has been created from HD`);
    await this._save(id, masterHD);
    const a = subscribeToBlockchain(
      new NormalAccount(id, index, coinManager, this.logger),
      observableBlockchain,
      this.logger
    );
    a.next(accountCreated(a));
    return a;
  }

  public trySyncAccount(account: Account): TaskEither<Error, Account> {
    const task = new Task(this.syncAccount(account));
    return new TaskEither<Error, Account>(task);
  }

  private syncAccount(account: Account): Either<Error, Account> {
    return left(new Error('not implemented!'));
  }

  private async _save(id: AccountID, key: HDNode): Promise<void> {
    this.logger.debug(
      `going to save account ${id} with key ${JSON.stringify(
        key.getIdentifier()
      )}`
    );
    await this.keyRepo.setHDNode(id, key);
  }
}

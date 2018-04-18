import {
  Account,
  accountCreated,
  AccountType,
  debit,
  NormalAccount,
  watchingAdddressUpdated
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

export interface AbstractAccountService<A extends Account> {
  readonly keyRepo: KeyRepository;
  getAddressForAccount: (a: A, index: number) => Promise<[A, string, string]>;
  createFromHD: (
    masterHD: HDNode,
    index: number,
    observableBlockchain: ObservableBlockchain,
    bchProxy: BlockchainProxy
  ) => Promise<A>;
  pay: (
    from: A,
    amount: Satoshi,
    destinations: ReadonlyArray<OuterEntity>
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
    destinations: ReadonlyArray<OuterEntity>
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
      from
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
      .catch(e => `Failed to broadcast TX! the error was ${e.toString()}`);
    return new NormalAccount(
      updatedAccount.id,
      updatedAccount.hdIndex,
      updatedAccount.coinManager,
      updatedAccount.observableBlockchain,
      this.logger,
      updatedAccount.type,
      updatedAccount.watchingAddresses
    );
  }

  public async getAddressForAccount(
    a: NormalAccount,
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
    const newAccount = new NormalAccount(
      a.id,
      a.hdIndex,
      a.coinManager,
      a.observableBlockchain,
      this.logger,
      AccountType.Normal,
      some([...a.watchingAddresses.getOrElse([]), address, changeAddress])
    );
    newAccount.next(watchingAdddressUpdated(address));
    newAccount.next(watchingAdddressUpdated(changeAddress));
    return [newAccount, address, changeAddress];
  }

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
    const a = new NormalAccount(
      id,
      index,
      coinManager,
      observableBlockchain,
      this.logger
    );
    a.next(accountCreated(a))
    return a
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

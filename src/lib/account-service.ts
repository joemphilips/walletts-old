import { Account, NormalAccount } from './account';
import KeyRepository, { InMemoryKeyRepository } from './key-repository';
import { crypto, HDNode } from 'bitcoinjs-lib';
import hash160 = crypto.hash160;
/* tslint:disable-next-line:no-submodule-imports */
import { none } from 'fp-ts/lib/Option';
import * as Logger from 'bunyan';
import { AccountID } from './primitives/identity';
import {
  BlockchainProxy,
  getObservableBlockchain,
  ObservableBlockchain
} from './blockchain-proxy';
import CoinManager from './coin-manager';

export interface AbstractAccountService<A extends Account> {
  readonly keyRepo: KeyRepository;
  getAddressForAccount: (a: A, index: number) => Promise<[string, string]>;
  createFromHD: (
    masterHD: HDNode,
    index: number,
    observableBlockchain: ObservableBlockchain,
    bchProxy: BlockchainProxy
  ) => Promise<A>;
}

export default class NormalAccountService
  implements AbstractAccountService<NormalAccount> {
  private readonly logger: Logger;
  constructor(parentLogger: Logger, public readonly keyRepo: KeyRepository) {
    this.logger = parentLogger.child({ subModule: 'NormalAccountService' });
  }

  public async getAddressForAccount(
    a: NormalAccount,
    index: number
  ): Promise<[string, string]> {
    this.logger.trace(`going to get address for Account ${a.id}`);
    const address = await this.keyRepo.getAddress(a.id, `0/${index}`);
    const changeAddress = await this.keyRepo.getAddress(a.id, `1/${index}`);
    if (!address || !changeAddress) {
      this.logger.error(
        `getAddressForAccount failed! repo was ${JSON.stringify(this.keyRepo)}`
      );
      throw new Error(
        `could not retrieve address! This account is not saved to repo!`
      );
    }
    return [address, changeAddress];
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
    return new NormalAccount(
      id,
      index,
      coinManager,
      observableBlockchain,
      none
    );
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

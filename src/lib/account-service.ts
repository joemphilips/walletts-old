import { Account, NormalAccount } from './account';
import KeyRepository from './key-repository';
import { crypto, HDNode } from 'bitcoinjs-lib';
import hash160 = crypto.hash160;
/* tslint:disable-next-line:no-submodule-imports */
import { none } from 'fp-ts/lib/Option';
import * as Logger from 'bunyan';
import { AccountID } from './primitives/identity';

interface AbstractAccountService<A extends Account> {
  readonly keyRepo: KeyRepository;
  getAddressForAccount: (a: A, index: number) => Promise<[string, string]>;
  createFromHD: (masterHD: HDNode, index: number) => Promise<A>;
}

export default class NormalAccountService
  implements AbstractAccountService<NormalAccount> {
  private readonly logger: Logger;
  constructor(public readonly keyRepo: KeyRepository, parentLogger: Logger) {
    this.logger = parentLogger.child({ subModule: 'NormalAccountService' });
  }

  public async getAddressForAccount(
    a: NormalAccount,
    index: number
  ): Promise<[string, string]> {
    this.logger.trace(`going to get address for Account ${a}`);
    const address = await this.keyRepo.getAddress(a.id, `0/${index}`);
    const changeAddress = await this.keyRepo.getAddress(a.id, `1/${index}`);
    if (!address || !changeAddress) {
      throw new Error(`could not retrieve address! This account is not saved to repo!`);
    }
    return [address, changeAddress];
  }

  public async createFromHD(
    masterHD: HDNode,
    index: number
  ): Promise<NormalAccount> {
    const pubkey = masterHD.deriveHardened(index).getPublicKeyBuffer();
    const id = hash160(pubkey).toString('hex');
    this._save(id, masterHD);
    return new NormalAccount(id, index, none);
  }

  private async _save(id: AccountID, key: HDNode): Promise<void> {
    this.keyRepo.setHDNode(id, key);
  }
}

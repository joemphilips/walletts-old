import { Account, NormalAccount } from './account';
import KeyRepository from './key-repository';
import { crypto, HDNode } from 'bitcoinjs-lib';
import hash160 = crypto.hash160;
/* tslint:disable-next-line:no-submodule-imports */
import { none } from 'fp-ts/lib/Option';

interface AbstractAccountService<A extends Account> {
  readonly keyRepo: KeyRepository;
  getAddressForAccount: (a: A, index: number) => Promise<[string, string]>;
  createFromHD: (masterHD: HDNode, index: number) => Promise<A>;
}

export default class NormalAccountService
  implements AbstractAccountService<NormalAccount> {
  constructor(public readonly keyRepo: KeyRepository) {}

  public async getAddressForAccount(
    a: NormalAccount,
    index: number
  ): Promise<[string, string]> {
    const address = await this.keyRepo.getAddress(
      a.id,
      `${a.hdIndex}'/0'/${index}`
    );
    const changeAddress = await this.keyRepo.getAddress(
      a.id,
      `${a.hdIndex}'/1/${index}`
    );
    if (!address || !changeAddress) {
      throw new Error(`could not retrieve address!`);
    }
    return [address, changeAddress];
  }

  public async createFromHD(
    masterHD: HDNode,
    index: number
  ): Promise<NormalAccount> {
    const pubkey = masterHD.deriveHardened(index).getPublicKeyBuffer();
    const id = hash160(pubkey).toString('hex');
    return new NormalAccount(id, index, none);
  }
}

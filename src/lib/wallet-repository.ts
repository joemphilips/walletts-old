import { AbstractWallet, BasicWallet } from '../lib/wallet';
import { AccountID } from './primitives/identity';
import { Account } from './account';

type AccountOrWallet = Account | AbstractWallet;
export default class InMemoryWalletRepo extends Map<
  AccountID,
  AccountOrWallet
> {
  constructor() {
    super();
  }

  public async load(id: string): Promise<AccountOrWallet | void> {
    return this.get(id);
  }

  public async save(id: string, wallet: AccountOrWallet): Promise<void> {
    this.set(id, wallet);
    return;
  }
}

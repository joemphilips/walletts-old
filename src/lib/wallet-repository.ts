import { BasicWallet } from '../lib/wallet';

export default class WalletRepository {
  constructor() {
    throw new Error(`WalletRepository not implemented!`);
  }

  public async loadWallet(walletDBPath: string): Promise<BasicWallet> {
    throw new Error(`loadWallet is not implemented!`);
  }
}

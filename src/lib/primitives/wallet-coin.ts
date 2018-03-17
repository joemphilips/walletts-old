import { TransactionBuilder } from 'bitcoinjs-lib';

export type Script = Buffer | null; // script necessary for signing Transaction

// Transaction Output with Metadata including script for spending
// equivalent to ManagedAddress in btcwallet.
export class WalletCoin {
  constructor(
    public readonly builder: TransactionBuilder,
    public readonly scripts: ReadonlyArray<Script>,
    public readonly scriptType: string,
    public readonly isChange?: boolean
  ) {}

  public isMine(): boolean {
    // fetch data from record ...
    return true;
  }
}

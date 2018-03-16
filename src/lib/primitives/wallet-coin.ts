import { TransactionBuilder } from 'bitcoinjs-lib';

type Script = Buffer | null; // script necessary for signing Transaction

// Transaction Output with Metadata including script for spending
// equivalent to ManagedAddress in btcwallet.
export class WalletCoin {
  public readonly scriptType: string;
  public readonly isChange?: boolean;
  public readonly scripts: ReadonlyArray<Script>;
  public readonly builder: TransactionBuilder;

  public get isMine(): boolean {
    // fetch data from record ...
    return true;
  }
}

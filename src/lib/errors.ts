// base class for all error generated intentionally by this module
export class WalletError implements Error {
  public readonly name = 'WalletError';

  constructor(public message: string) {}

  public toString(): string {
    return this.name + ': ' + this.message;
  }
}

export class WalletNotFoundError extends WalletError {}

export class FailedToCreateWalletError extends WalletError {
  public readonly name = 'FailedToCreateWalletError';
}

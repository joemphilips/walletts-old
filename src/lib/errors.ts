// base class for all error generated intentionally by this module
export class WalletError implements Error {
  public name = "WalletError";

  constructor(public message: string) {}

  toString() {
    return this.name + ": " + this.message;
  }
}

export class WalletNotFoundError extends WalletError {}

export class FailedToCreateWalletError extends WalletError {
  public name = "FailedToCreateWalletError";
}

// base class for all error generated intentionally by this module
class WalletError implements Error {
  public name = "WalletError";

  constructor(public message: string) {}

  toString() {
    return this.name + ": " + this.message;
  }
}

class WalletNotFoundError extends WalletError {}

class FailedToCreateWalletError extends WalletError {
  public name = "FailedToCreateWalletError";
}

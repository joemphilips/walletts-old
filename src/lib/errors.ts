// base class for all error generated intentionally by this module
export class WalletError extends Error {}

export class WalletNotFoundError extends WalletError {}

export class FailedToCreateWalletError extends WalletError {}

export class BalanceError extends WalletError {}

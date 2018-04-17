import { Outpoint } from 'bitcoin-core';
import { script } from 'bitcoinjs-lib';
/* tslint:disable no-submodule-imports */
import { none, Option } from 'fp-ts/lib/Option';
import { Satoshi } from './satoshi';

/**
 * script necessary for signing Transaction.
 * In case of p2pkh, pkwpkh, this should be public key Buffer
 */
export type Script = Buffer | null;

/* tslint:disable no-mixed-interface */
export interface AbstractCoin {
  readonly txid: string;
  readonly amount: Satoshi;
  readonly confirmation: number;
  readonly scriptPubKey: Buffer;
  readonly label: Option<string>;
  /* tslint:disable-next-line readonly-keyword */
  isUsed: boolean;
  readonly [key: string]: any;
}
export type ScriptType =
  | 'witnesspubkeyhash'
  | 'witnessscripthash'
  | 'pubkeyhash'
  | 'scripthash'
  | 'multisig'
  | 'pubkey'
  | 'witnesscommitment'
  | 'nulldata'
  | 'nonstandard';

// Transaction Output with Metadata including script for spending
export class MyWalletCoin implements AbstractCoin {
  public static fromOutpointAndPubKey(
    out: Outpoint,
    scriptPubKey: Buffer,
    pubKey: Buffer,
    amount: Satoshi,
    isUsed: boolean,
    confirmation: number
  ): MyWalletCoin {
    return new MyWalletCoin(
      scriptPubKey,
      script.classifyOutput(scriptPubKey),
      pubKey,
      none,
      out.id,
      amount,
      isUsed,
      confirmation
    );
  }
  constructor(
    public readonly scriptPubKey: Buffer,
    public readonly scriptType: ScriptType,
    public readonly redeemScript: Script,
    public readonly label: Option<string>,
    public readonly txid: string,
    public readonly amount: Satoshi = Satoshi.fromNumber(0).value as Satoshi,
    public isUsed: boolean = false,
    public readonly confirmation: number = 0,
    public readonly isChange?: boolean
  ) {}
}

type confirmCoin = <C extends AbstractCoin>(c: C) => C;
export const confirmMyWalletCoin = (c: MyWalletCoin) =>
  new MyWalletCoin(
    c.scriptPubKey,
    c.scriptType,
    c.redeemScript,
    c.label,
    c.txid,
    c.amount,
    c.isUsed,
    c.confirmation + 1,
    c.isChange
  );

/**
 * internal key for referencing to WalletCoins
 */
export class CoinID {
  public static fromOutpoint(outpoint: Outpoint): CoinID {
    const id = outpoint.id + outpoint.index.toString(16);
    return new CoinID(id);
  }

  constructor(public id: string) {}
}

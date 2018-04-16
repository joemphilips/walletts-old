import { Outpoint } from 'bitcoin-core';
import { HDNode, Out, script, TransactionBuilder } from 'bitcoinjs-lib';
/* tslint:disable no-submodule-imports */
import { none, None, Option } from 'fp-ts/lib/Option';
import { Satoshi } from '../primitives/balance';

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
  // readonly fromOutandHDNode: (out: Out, txid: string, node: HDNode) => AbstractCoin,
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
    amount: number
  ): MyWalletCoin {
    return new MyWalletCoin(
      scriptPubKey,
      script.classifyOutput(scriptPubKey),
      pubKey,
      none,
      out.id,
      Satoshi.fromNumber(amount).value as Satoshi
    );
  }
  constructor(
    public readonly scriptPubKey: Buffer,
    public readonly scriptType: ScriptType,
    public readonly redeemScript: Script,
    public readonly label: Option<string>,
    public readonly txid: string,
    public readonly amount: Satoshi = Satoshi.fromNumber(0).value as Satoshi,
    public readonly confirmation: number = 0,
    public readonly isChange?: boolean
  ) {}
}

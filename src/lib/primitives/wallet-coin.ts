import { Outpoint } from 'bitcoin-core';
import { HDNode, Out, script, TransactionBuilder } from 'bitcoinjs-lib';
/* tslint:disable no-submodule-imports */
import { none, None, Option } from 'fp-ts/lib/Option';
import { Balance } from '../primitives/balance';

/**
 * script necessary for signing Transaction.
 * In case of p2pkh, pkwpkh, this should be public key Buffer
 */
export type Script = Buffer | null;

/* tslint:disable no-mixed-interface */
export interface AbstractCoin {
  readonly txid: string;
  readonly amount: Balance;
  readonly confirmation: number;
  readonly scriptPubKey: Buffer;
  readonly label: Option<string>;
  // readonly fromOutandHDNode: (out: Out, txid: string, node: HDNode) => AbstractCoin,
  readonly [key: string]: any;
}

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
      out.id,
      none,
      pubKey,
      new Balance(amount)
    );
  }
  constructor(
    public readonly scriptPubKey: Buffer,
    public readonly scriptType: string,
    public readonly txid: string,
    public readonly label: Option<string>,
    public readonly redeemScript: Script,
    public readonly amount: Balance = new Balance(0),
    public readonly confirmation: number = 0,
    public readonly isChange?: boolean
  ) {}
}

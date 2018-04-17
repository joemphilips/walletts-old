import { Satoshi } from '../primitives/satoshi';

export type Option<T> = T | null;

export interface OutpointWithScriptAndAmount {
  readonly id: string;
  readonly index: number;
  readonly scriptPubKey: Buffer;
  readonly amount: Satoshi;
}

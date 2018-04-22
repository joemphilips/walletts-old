/**
 *
 * ref: https://github.com/chainside/BIP-proposal/blob/master/BIP.mediawiki
 * @type {number}
 */
import { Satoshi } from './satoshi';

export const PurposeField = 100; // TODO: specify proper index

/**
 * bip44 registered Coin type
 * ref: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
export enum SupportedCoinType {
  BTC = 0,
  ETH = 60
}

export const FALLBACK_FEE = Satoshi.fromNumber(1000).value as Satoshi;

export const GAP_LIMIT = 20;

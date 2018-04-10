/**
 *
 * ref: https://github.com/chainside/BIP-proposal/blob/master/BIP.mediawiki
 * @type {number}
 */
export const PurposeField = 100; // TODO: specify proper index

/**
 * bip44 registered Coin type
 * ref: https://github.com/satoshilabs/slips/blob/master/slip-0044.md
 */
export enum SupportedCoinType {
  BTC = 0,
  ETH = 60
}

import { HDNode } from 'bitcoinjs-lib';
import { Identity } from './primitives/identity';

export default interface KeyDB {
  readonly get: (id: Identity) => HDNode;
};

export class InMemoryDB extends Map<Identity, HDNode> implements KeyDB {
  get (id: Identity) {
    return HDNode.fromSeedHex("0xfffffffffffffffffffffffff")
  }
}

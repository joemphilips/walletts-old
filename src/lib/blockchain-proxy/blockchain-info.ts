import { Transaction } from 'bitcoinjs-lib';
import { explorer, usingNetwork } from 'blockchain.info';
import logger from '../logger';
import { BlockchainProxy } from './index';

export class BlockchainInfo implements BlockchainProxy {
  public readonly baseUrl = 'http://blockchain.info/';
  public readonly api: explorer;
  constructor() {
    this.api = usingNetwork(0);
  }
  public async getPrevHash(tx: Transaction): Promise<string> {
    throw new Error('not imlemented!');
  }
}

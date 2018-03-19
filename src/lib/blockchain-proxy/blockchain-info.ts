import { Transaction } from 'bitcoinjs-lib';
import { blockexplorer, usingNetwork } from 'blockchain.info';
import logger from '../logger';
import { BlockchainProxy } from './index';

export class BlockchainInfo implements BlockchainProxy {
  public readonly baseUrl = 'http://blockchain.info/';
  public readonly api: blockexplorer;
  constructor() {
    this.api = usingNetwork(0);
  }
  public async getPrevHash(tx: Transaction): Promise<string> {
    throw new Error('not imlemented!');
  }
}

import { Transaction } from 'bitcoinjs-lib';
import { blockexplorer, usingNetwork } from 'blockchain.info';
import logger from '../logger';
import { BlockchainProxy } from './index';
import * as Logger from 'bunyan';

export class BlockchainInfo implements BlockchainProxy {
  public readonly baseUrl = 'http://blockchain.info/';
  public readonly api: blockexplorer;
  public readonly logger: Logger;
  constructor(log: Logger) {
    this.logger = log.child({ nameSpace: 'BlockchainInfo-Proxy' });
    this.api = usingNetwork(0);
  }
  public async getPrevHash(tx: Transaction): Promise<string> {
    this.logger.trace(`going to get PrevHash for ${tx}`);
    throw new Error('not imlemented!');
  }
}

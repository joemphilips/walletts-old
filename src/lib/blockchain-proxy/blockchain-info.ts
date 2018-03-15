import { Transaction } from 'bitcoinjs-lib';
import { explorer, usingNetwork } from 'blockchain.info';
import logger from '../logger';
import { BlockchainProxy } from './blockchain-proxy';

export class BlockchainInfo implements BlockchainProxy {
  public readonly baseUrl = 'http://blockchain.info/';
  public readonly api: explorer;
  constructor() {
    this.api = usingNetwork(0);
  }
  public async getPrevHash(tx: Transaction) {
    let result;
    const hexTx: string = tx.getId();
    try {
      result = await this.api.getTx(hexTx);
      result = result.inputs;
    } catch (e) {
      logger.warn(`failed to get TX from blockchain.info with ${hexTx}`);
      throw e;
    }
    logger.info(result);
    return result;
  }
}

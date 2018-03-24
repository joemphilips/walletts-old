import { Network, Transaction } from 'bitcoinjs-lib';
import * as Logger from 'bunyan';

export interface BlockchainProxy {
  readonly getPrevHash: (tx: Transaction) => Promise<any>;
  readonly baseUrl?: string;
  readonly api?: any;
  readonly client?: any;
  readonly network?: Network;
  readonly logger: Logger;
}

export * from './blockchain-info';
export * from './trusted-rpc';

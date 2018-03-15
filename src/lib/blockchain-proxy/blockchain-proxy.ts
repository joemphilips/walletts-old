import { Network, Transaction } from 'bitcoinjs-lib';

export interface BlockchainProxy {
  readonly getPrevHash: (tx: Transaction) => Promise<any>;
  readonly baseUrl?: string;
  readonly api?: any;
  readonly client?: any;
  readonly network?: Network;
}

import { Network, Transaction } from 'bitcoinjs-lib';
import * as Logger from 'bunyan';

export interface BlockchainProxy {
  readonly getPrevHash: (tx: Transaction) => Promise<any>;
  readonly baseUrl?: string;
  readonly api?: any;
  readonly client?: any;
  readonly network?: Network;
  readonly logger: Logger;
  readonly ping: () => Promise<void>;
  readonly isPruned: () => Promise<boolean>;
  readonly getAddressesWithBalance: (
    addresses: ReadonlyArray<string>
  ) => Promise<SyncInfo>;
}

export interface SyncInfo {
  /**
   * index of the last address found in the blockchain
   */
  i: number;

  /**
   * address => balance in blockchain
   */
  addresses: {
    [key: string]: number;
  };
}

export * from './blockchain-info';
export * from './trusted-rpc';

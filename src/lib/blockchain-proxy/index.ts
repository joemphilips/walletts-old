import { Block, Network, Transaction } from 'bitcoinjs-lib';
import * as Logger from 'bunyan';
/* tslint:disable no-submodule-imports */
import { Observable } from '@joemphilips/rxjs';
import { socket } from 'zeromq';
import { EventEmitter } from 'events';

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
  readonly send: (hexTx: string) => Promise<void>
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

export class BlockchainEventEmitter extends EventEmitter {
  constructor(url: string) {
    super();
    const sock = socket('sub');
    sock.connect(url);
    sock.subscribe('rawblock');
    sock.on('message', (topic, message) => {
      this.emit('zeromq', [topic, message.toString('hex')]);
    });
  }
}

export type ObservationType = 'rawtx' | 'rawblock';
/* tslint:disable interface-over-type-literal */
export type TransactionArrived = Transaction;
export type BlockArrived = Block;
export type Reorg = {
  height: number;
};
export type BlockchainEvent = TransactionArrived | BlockArrived | Reorg;
export type ObservableBlockchain = Observable<BlockchainEvent>;

export const getObservableBlockchain = (url: string): ObservableBlockchain => {
  const sock = new BlockchainEventEmitter(url);
  return Observable.merge(
    Observable.fromEvent<[ObservationType, string]>(sock, 'zeromq')
      .filter(([topic, _]: [ObservationType, string]) => topic === 'rawblock')
      .map(([_, msg]: [ObservationType, string]) => Block.fromHex(msg)),
    Observable.fromEvent<[ObservationType, string]>(sock, 'zeromq')
      .filter(([topic, _]: [ObservationType, string]) => topic === 'rawtx')
      .map(([_, msg]: [ObservationType, string]) => Transaction.fromHex(msg))
  );
};

export * from './blockchain-info';
export * from './trusted-rpc';

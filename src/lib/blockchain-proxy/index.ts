import { Network, Transaction } from 'bitcoinjs-lib';
import * as Logger from 'bunyan';
/* tslint:disable no-submodule-imports */
import { Observable } from '@joemphilips/rxjs';
import { Socket, socket } from 'zeromq';
import EventEmitter = NodeJS.EventEmitter;
import {NodeStyleEventEmitter} from "@joemphilips/rxjs/dist/package/observable/FromEventObservable";

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

export class ObservableBlockchain extends EventEmitter {
  constructor(url: string) {
    super();
    const sock = socket('sub');
    sock.bindSync(url);
    sock.subscribe("Kitty cat");
    sock.on('message', (topic, message) => {
      this.emit('zeromq', [topic, message]);
    })
  }
}

export const getObservableBlockchain = (url: string): Observable<[string, string]> => {
  const sock = new ObservableBlockchain(url);
  return Observable.fromEvent(
    sock as NodeStyleEventEmitter,
    'message'
  );
};

export * from './blockchain-info';
export * from './trusted-rpc';

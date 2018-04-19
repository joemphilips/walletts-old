import { Block, Network, Out, Transaction } from 'bitcoinjs-lib';
import * as Logger from 'bunyan';
/* tslint:disable no-submodule-imports */
import { Observable } from '@joemphilips/rxjs';
import { socket } from 'zeromq';
import { EventEmitter } from 'events';
import { FeeEstimateMode, ValidateAddressResult } from 'bitcoin-core';
import { Satoshi } from '../primitives/satoshi';
import { OutpointWithScriptAndAmount } from '../primitives/utils';

export interface BlockchainProxy {
  readonly getPrevHash: (tx: Transaction) => Promise<any>;
  readonly baseUrl?: string;
  readonly api?: any;
  readonly client: any;
  readonly network?: Network;
  readonly logger: Logger;
  readonly ping: () => Promise<void>;
  readonly isPruned: () => Promise<boolean>;
  readonly getAddressesWithBalance: (
    addresses: ReadonlyArray<string>
  ) => Promise<SyncInfo>;
  readonly send: (hexTx: string) => Promise<void>;
  readonly validateAddress: (address: string) => Promise<ValidateAddressResult>;
  readonly estimateSmartFee: (
    target: number,
    mode: FeeEstimateMode
  ) => Promise<number>;
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
/**
 * Hot observable which publishes the event occurred in the blockchain.
 * This is likely to update to handle more various kinds of actions as
 * the blockchain supports more features, e.g. colored coins, withdrawal
 * from the drivechain, and layer 2 channel closing.
 */
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

// TODO: return Either<Error, OutpointWithScriptAndAmount>
export const prepareOutpointForImport = (tx: Transaction) => (
  o: Out
): OutpointWithScriptAndAmount => {
  const index = tx.outs.indexOf(o);
  return {
    id: tx.getId(),
    index,
    scriptPubKey: tx.outs[index].script,
    amount: Satoshi.fromNumber(tx.outs[index].value).fold(e => {
      throw e;
    }, s => s)
  };
};

export * from './blockchain-info';
export * from './trusted-rpc';

import { Network, Transaction } from 'bitcoinjs-lib';
import * as fs from 'fs';
const explorer = require('blockchain.info/blockexplorer');
const Client = require('bitcoin-core');
const ini = require('ini');
const debug = require('debug')('blockchain-proxy');

export interface BlockchainProxy {
  readonly getPrevHash: (tx: Transaction) => Promise<any>;
  readonly baseUrl?: string;
  readonly api?: any;
  readonly client?: any;
  readonly network?: Network;
}

export class Stub implements BlockchainProxy {
  public async getPrevHash(tx: Transaction) {
    return '';
  }
}

export class RPC implements BlockchainProxy {
  public readonly client: any;
  constructor(confPath: fs.PathLike) {
    debug(`going to use testnet bitcoin-core specified in ${confPath}`);
    const conf = ini.parse(fs.readFileSync(confPath, 'utf-8'));
    const opts = {
      username: conf.rpcuser,
      password: conf.rpcpassword,
      host: conf.rpcconnect,
      network: conf.testnet ? 'testnet' : 'mainnet'
    };
    this.client = new Client(opts);
  }

  public async getPrevHash(tx: Transaction): Promise<ReadonlyArray<string>> {
    debug(`tx is ${JSON.stringify(tx.toHex())}`);
    debug(`client is ${JSON.stringify(this.client)}`);
    debug(`tx id is ${tx.getId()}`);
    const RawTx: string = await this.client.getRawTransaction(tx.getId());
    debug(`Raw TX is ${RawTx}`);
    const txwithInfo: any = await this.client.decodeRawTransaction(RawTx);
    debug(`tx withInfo is ${JSON.stringify(txwithInfo)} `);

    // using Array.map() will cause bizarre error. So for loop instead.
    const promises: ReadonlyArray<any> = [];
    for (const i of txwithInfo.vin) {
      const promise = this.client.getRawTransaction(i.txid);
      promises.push(promise);
    }
    const prevTxRaw = await Promise.all(promises);

    return prevTxRaw
      .map((rtx: string) => Transaction.fromHex(rtx))
      .map((tx: Transaction) => tx.getId());
  }
  public async isConnected() {
    if (this.client.ping) {
      console.log('not implemented !');
    }
  }
}

export class BlockchainInfo implements BlockchainProxy {
  public readonly baseUrl = 'http://blockchain.info/';
  public readonly api: any;
  constructor() {
    this.api = explorer.usingNetwork(0);
  }
  public async getPrevHash(tx: Transaction) {
    const result;
    const hexTx: string = tx.getId();
    try {
      result = await this.api.getTx(hexTx);
      result = result.inputs;
    } catch (e) {
      console.warn(`failed to get TX from blockchain.info with ${hexTx}`);
      throw e;
    }
    console.log(result);
    return result;
  }
}

import { Client } from 'bitcoin-core';
import { Transaction } from 'bitcoinjs-lib';
import * as fs from 'fs';
import * as ini from 'ini';
import logger from '../logger';
import { BlockchainProxy } from './index';

export class RPC implements BlockchainProxy {
  public readonly client: any;
  constructor(confPath: fs.PathLike) {
    logger.debug(`going to use testnet bitcoin-core specified in ${confPath}`);
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
    logger.debug(`tx is ${JSON.stringify(tx.toHex())}`);
    logger.debug(`client is ${JSON.stringify(this.client)}`);
    logger.debug(`tx id is ${tx.getId()}`);
    const RawTx: string = await this.client.getRawTransaction(tx.getId());
    logger.debug(`Raw TX is ${RawTx}`);
    const txwithInfo: any = await this.client.decodeRawTransaction(RawTx);
    logger.debug(`tx withInfo is ${JSON.stringify(txwithInfo)} `);

    // using Array.map() will cause bizarre error. So for loop instead.
    const promises: any[] = [];
    for (const i of txwithInfo.vin) {
      const promise = this.client.getRawTransaction(i.txid);
      promises.push(promise);
    }
    const prevTxRaw = await Promise.all(promises);

    return prevTxRaw
      .map((rtx: string) => Transaction.fromHex(rtx))
      .map((t: Transaction) => t.getId());
  }
  public async isConnected(): Promise<void> {
    if (this.client.ping) {
      logger.error('not implemented !');
    }
  }
}

import Client, { ClientConstructorOption } from 'bitcoin-core';
import { Transaction } from 'bitcoinjs-lib';
import * as fs from 'fs';
import * as ini from 'ini';
import logger from '../logger';
import { BlockchainProxy, SyncInfo } from './index';
import * as Logger from 'bunyan';

interface ValidateAddressResult {
  isvalid: boolean;
  address?: string;
  scriptPubKey?: string;
  ismine?: boolean;
  iswatchonly?: boolean;
  isscript?: boolean;
  script?: string;
  hex?: string;
  addresses?: string[];
  sigsrequired?: number;
  pubkey?: string;
  iscompressed?: boolean;
  account?: string;
  timestamp?: number;
  hdkeypath?: string;
  hdmasterkeyid?: string;
}

export class TrustedBitcoindRPC implements BlockchainProxy {
  public readonly client: Client;
  public readonly logger: Logger;
  constructor(
    confPath: string,
    username: string,
    password: string,
    rpcip: string,
    rpcport: string,
    log: Logger,
    network?: 'testnet' | 'mainnet' | 'regtest'
  ) {
    this.logger = log.child({ subModule: 'TrustedBitcoindRPC' });
    this.logger.debug(
      `going to use testnet bitcoin-core specified in ${confPath}`
    );
    let conf;
    let opts: ClientConstructorOption;
    try {
      conf = ini.parse(fs.readFileSync(confPath, 'utf-8'));
      opts = {
        username: conf.rpcuser,
        password: conf.rpcpassword,
        host: conf.rpcconnect,
        network: conf.testnet ? 'testnet' : 'mainnet'
      };
    } catch (e) {
      this.logger.info(
        `failed to load config file for bitcoind, rolling back to default`
      );
      opts = {
        network,
        host: rpcip,
        port: rpcport,
        username,
        password
      };
    }
    this.logger.info(
      `setting up blockchain proxy with ${JSON.stringify(opts)} ...`
    );
    this.client = new Client(opts);
  }

  public async isPruned(): Promise<boolean> {
    const info = await this.client.getBlockchainInfo();
    return info.pruned;
  }

  public async validateAddress(
    address: string
  ): Promise<ValidateAddressResult> {
    return this.client.validateAddress(address);
  }

  public async ping(): Promise<void> {
    return this.client.ping();
  }

  public async send(hexTx: string): Promise<void> {
    try {
      this.client.sendRawTransaction(hexTx);
    } catch (e) {
      this.logger.error(`failed to send Transaction ${hexTx} !`);
    }
  }

  public async getAddressesWithBalance(
    addresses: ReadonlyArray<string>
  ): Promise<SyncInfo> {
    throw Error(`Not implemented !`);
  }

  /**
   * utility function for regtesting
   * @param {string} address
   * @returns {Promise<void>}
   */
  public async prepare500BTC(address: string): Promise<boolean> {
    const info = await this.client.getBlockchainInfo();
    if (info.blocks > 1000) {
      return false;
    }
    await this.client.generateToAddress(10, address);
    await this.client.generate(100);
    return true;
  }

  public async getPrevHash(tx: Transaction): Promise<ReadonlyArray<string>> {
    this.logger.debug(`tx is ${JSON.stringify(tx.toHex())}`);
    this.logger.debug(`client is ${JSON.stringify(this.client)}`);
    this.logger.debug(`tx id is ${tx.getId()}`);
    const RawTx: string = (await this.client.getRawTransaction(
      tx.getId()
    )) as string;
    this.logger.debug(`Raw TX is ${RawTx}`);
    const txwithInfo: any = await this.client.decodeRawTransaction(RawTx);
    this.logger.debug(`tx withInfo is ${JSON.stringify(txwithInfo)} `);

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
      this.logger.error('not implemented !');
    }
  }
}

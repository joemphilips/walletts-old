import chalk from 'chalk';
import {
  Config,
  default as loadConfig,
  WalletServiceOpts
} from '../lib/config';
import container from '../lib/container';
import { BasicWallet } from '../lib/wallet';
import WalletRepository from '../lib/wallet-repository';
import GRPCServer, { RPCServer } from './grpc-server';
import { UIProxy, WalletAction } from './uiproxy';
import getClient, { RPCClient } from './grpc-client';
import logger from '../lib/logger';

export default class WalletLauncher {
  public readonly cfg: Config;
  private readonly walletRepo: WalletRepository;
  private readonly uiproxy: UIProxy;
  private readonly logger: any;
  private readonly server: RPCServer;
  private readonly client: RPCClient; // stub for calling wallet server

  constructor(opts: WalletServiceOpts) {
    this.cfg = container.resolve('cfg');
    this.walletRepo = new WalletRepository(this.cfg);
    this.server = container.resolve('server');
    this.uiproxy = container.resolve('uiproxy');
    this.logger = logger;
    this.client = getClient(this.cfg);
  }

  public async run(): Promise<void> {
    this.server.start(this.walletRepo, this.cfg);
    chalk(`server has been started`);
    chalk(`what do you want with your Wallet?`);
    const action: WalletAction = await this.uiproxy.setupWalletInteractive();
    if (action.kind === 'createWallet') {
      this.client.createWallet(
        {
          nameSpace: action.payload.nameSpace,
          passPhrase: action.payload.passPhrase
        },
        (err, res) => {
          if (err) {
            throw new Error();
          }
          this.logger.info(`wallet created! response from server is ${res}`);
        }
      );
    } else if (action.kind === 'importWallet') {
      this.client.createWallet(
        {
          nameSpace: action.payload.nameSpace,
          passPhrase: action.payload.passPhrase,
          seed: action.payload.seed
        },
        (err, res) => {
          if (err) {
            throw new Error();
          }
          this.logger.info(`wallet created! response from server is ${res}`);
        }
      );
      throw new Error('not supported yet!');
    } else if (action.kind === 'doNothing') {
      throw new Error('not supported yet!');
    } else {
      throw new Error(`unReachable!`);
    }
  }
}

import chalk from 'chalk';
import {
  Config,
  default as loadConfig,
  WalletServiceOpts
} from '../lib/config';
import container from '../lib/container';
import { BasicWallet } from '../lib/wallet';
import WalletRepository from '../lib/wallet-repository';
import GRPCServer from './grpc-server';
import { UIProxy, WalletAction } from './uiproxy';
import getClient from './grpc-client'

export default class WalletLauncher {
  public readonly cfg: Config;
  private readonly walletRepo: WalletRepository;
  private readonly server: GRPCServer;
  private readonly uiproxy: UIProxy;
  private readonly logger: any;
  private readonly walletService: any;
  private readonly client: any; // stub for calling wallet server

  constructor(opts: WalletServiceOpts) {
    this.cfg = container.resolve('cfg');
    this.walletRepo = new WalletRepository(this.cfg);
    this.server = container.resolve('server');
    this.uiproxy = container.resolve('uiproxy');
    this.logger = container.resolve('logger');
    this.client = getClient(this.cfg)
  }

  public async run(): Promise<void> {
    this.server.start(this.walletRepo, this.cfg);
    chalk(`server has been started`);
    chalk(`what do you want with your Wallet?`);
    const action: WalletAction = await this.uiproxy.setupWalletInteractive();
    if (action.kind === 'createWallet') {
      this.client.createWallet({
        nameSpace: action.payload.nameSpace,
        passPhrase: action.payload.passPhrase,
      })
    } else if (action.kind === 'importWallet') {
      throw new Error('not supported yet!');
    } else if (action.kind === 'doNothing') {
      throw new Error('not supported yet!');
    } else {
      throw new Error(`unReachable!`);
    }
  }
}

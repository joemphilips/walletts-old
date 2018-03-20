import chalk from 'chalk';
import {grpc} from 'grpc-web-client';
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
import * as wallet_pb from 'proto/walletserver_pb'
import {WalletService} from 'proto/walletserver_pb_service'

export default class WalletLauncher {
  public readonly cfg: Config;
  private readonly walletRepo: WalletRepository;
  private readonly server: GRPCServer;
  private readonly uiproxy: UIProxy;
  private readonly logger: any;
  private readonly walletService: any;

  constructor(opts: WalletServiceOpts) {
    this.cfg = container.resolve('cfg');
    this.walletRepo = new WalletRepository(this.cfg);
    this.server = container.resolve('server');
    this.uiproxy = container.resolve('uiproxy');
    this.logger = container.resolve('logger');
  }

  public async run(): Promise<void> {
    this.server.start(this.walletRepo, this.cfg);
    chalk(`server has been started`);
    chalk(`what do you want with your Wallet?`);
    const action: WalletAction = await this.uiproxy.setupWalletInteractive();
    if (action.kind === 'createWallet') {
      const req = new wallet_pb.createWalletRequest()
      grpc.invoke(WalletService.createWallet, {
        request: req,
        host: this.cfg.port,
        onMessage: (message: wallet_pb.createWalletResponse) => {
          this.logger.info(`resopnse was ${message.toObject()}`)
        },
        onEnd: (code: grpc.Code, msg: string | undefined, trailer: grpc.Metadata) => {
          if(code === grpc.Code.OK) {
            this.logger.info(`received folloing message from server ${msg}`)
          } else {
            this.logger.error(`There was error with code ${code}, ${msg}`)
          }
        }
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

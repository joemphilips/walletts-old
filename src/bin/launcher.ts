import chalk from 'chalk';
import { Config, default as loadConfig } from '../lib/config';
import container from '../lib/container';
import { BasicWallet } from '../lib/wallet';
import WalletService from '../lib/wallet-service';
import GRPCServer, { RPCServer } from './grpc-server';
import { UIProxy, WalletAction } from './uiproxy';
import getClient, { RPCClient } from './grpc-client';
import getLogger from '../lib/logger';
import { bchInfoSource } from './grpc-common';

export default class WalletLauncher {
  public readonly cfg: Config;
  private readonly walletRepo: WalletService;
  private readonly uiproxy: UIProxy;
  private readonly logger: any;
  private readonly server: RPCServer<BasicWallet>;
  private readonly client: RPCClient; // stub for calling wallet server

  constructor(opts: Partial<Config>) {
    this.cfg = loadConfig(opts);
    this.logger = getLogger(this.cfg.debugFile);
    this.logger.info(`config object is ${this.cfg}`);
    this.walletRepo = new WalletService(this.cfg, this.logger);
    this.server = new GRPCServer(this.logger);
    this.uiproxy = container.resolve('uiproxy');
    this.client = getClient(this.cfg.url);
  }

  public async run(): Promise<void> {
    this.server.start(this.walletRepo, this.cfg);
    chalk(`server has been started`);
    chalk(`what do you want to do with your Wallet?`);
    const action: WalletAction = await this.uiproxy.setupWalletInteractive();
    if (action.kind === 'createWallet') {
      this.client.createWallet(
        {
          nameSpace: action.payload.nameSpace,
          passPhrase: action.payload.passPhrase
        },
        (e, _) => {
          if (e) {
            this.logger.error(e.toString());
          }
        }
      );
    } else if (action.kind === 'importWallet') {
      this.client.createWallet(
        {
          nameSpace: action.payload.nameSpace,
          passPhrase: action.payload.passPhrase,
          seed: action.payload.seed
        },
        (e, _) => {
          if (e) {
            this.logger.error(e.toString());
          }
        }
      );
      throw new Error('not supported yet!');
    } else if (action.kind === 'doNothing') {
      throw new Error('not supported yet!');
    } else {
      throw new Error(`unReachable!`);
    }

    // setup blockchain
    const bchSetupAction = await this.uiproxy.chooseBlockchainProxy();
    if (bchSetupAction.kind === 'trustedRPC') {
      const { rpcusername, rpcpass, rpcip, rpcport } = bchSetupAction.payload;
      this.client.setupBlockchainProxy(
        {
          type: bchInfoSource.trusted_rpc,
          rpcusername,
          rpcpass,
          rpcip,
          rpcport
        },
        (e: NodeJS.ErrnoException, _: { success: boolean }) => {
          if (e) {
            this.logger.error(e.toString());
          }
        }
      );
    } else {
      throw new Error(`not supported yet!`);
    }
  }
}

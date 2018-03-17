import {
  Config,
  default as loadConfig,
  WalletServiceOpts
} from '../lib/config';
import container from '../lib/container';
import GRPCServer from './rpc_server';
import { BasicWallet } from '../lib/wallet';
import {FailedToCreateWalletError, WalletError, WalletNotFoundError} from "../";
import {UIProxy, WalletAction} from "./uiproxy";

// facade class for wrapping up wallet with rpc interface
// This is just one example of very basic wallet.
// You may compose different kind of Classes and create different kinds of wallet.
// e.g. wallet for managing community funds, wallet which uses external HD Key for signing, etc.
export default class WalletService {
  public readonly cfg: Config;
  private readonly wallet: BasicWallet;
  private readonly server: GRPCServer;
  private readonly uiproxy: UIProxy;
  private readonly logger: any;

  constructor(opts: WalletServiceOpts) {
    this.cfg = container.resolve('cfg');
    this.wallet = container.resolve('wallet');
    this.server = container.resolve('server');
    this.uiproxy = container.resolve('uiproxy');
    this.logger = container.resolve('logger')
  }

  public async run(): Promise<void> {
    try {
      await this.wallet.load(this.cfg.walletDBPath);
    } catch(e) {
      if(e instanceof WalletNotFoundError) {
        // TODO: try recovering wallet before creating new one.
        const action: WalletAction
          = await this.uiproxy.createNewWallet();
        switch (action.kind) {
          case 'createWallet':
            this.logger.info('going to create wallet from random seed');
            const success: boolean = await this.wallet.createNew(
              <string>action.payload
            );
            if (!success) {
              throw new FailedToCreateWalletError(
                'could not create wallet in WalletDB!'
              );
            }
            this.logger.info('successfully created wallet!');
            break;
          case 'importWallet':
            this.logger.info(`trying to import wallet from given seed ${action.payload} ...`);
            await this.wallet.fromSeed(action.payload)
            break;
          default:
            throw new WalletError(
              `could not find any wallet, nor doesn't now how to create new wallet`
            );
        }
      } else {
        throw new Error('failed to load Wallet !');
      }
    }

    this.server.start(this.wallet, this.cfg);
  }
}

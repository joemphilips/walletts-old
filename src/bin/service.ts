import {
  Config,
  default as loadConfig,
  WalletServiceOpts
} from '../lib/config';
import container from '../lib/container';
import GRPCServer from '../lib/rpc_server';
import { BasicWallet } from '../lib/wallet';

// facade class for wrapping up wallet with rpc interface
// This is just one example of very basic wallet.
// You may compose different kind of Classes and create different kinds of wallet.
// e.g. wallet for managing community funds, wallet which uses external HD Key for signing, etc.
export default class WalletService {
  public readonly cfg: Config;
  private readonly wallet: BasicWallet;
  private readonly server: GRPCServer;

  constructor(opts: WalletServiceOpts) {
    this.cfg = container.resolve('cfg');
    this.wallet = container.resolve('wallet');
    this.server = container.resolve('server');
  }

  public async run(): Promise<void> {
    try {
      await this.wallet.load(this.cfg.walletDBPath);
    } catch {
      throw new Error('failed to load Wallet !');
    }

    this.server.start(this.wallet, this.cfg);
  }
}

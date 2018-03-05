import container from '../container'
import {Config, default as loadConfig, WalletServiceOpts} from "../config";
import WalletDB from "../walletdb";
import {BasicWallet} from '../wallet'
import GRPCServer from "../rpc_server";
import {DecryptStream, EncryptStream} from "../stream";


// facade class for wrapping up wallet with rpc interface
// This is just one example of very basic wallet.
// You may compose different kind of Classes and create different kinds of wallet.
// e.g. wallet for managing community funds, wallet which uses external HD Key for signing, etc.
export default class WalletService {
  public cfg: Config;
  private walletdb: WalletDB<EncryptStream, DecryptStream>;
  private wallet: BasicWallet;
  private server: GRPCServer;

  constructor(opts: WalletServiceOpts) {
    this.cfg = loadConfig(opts)
    this.walletdb = container.resolve('WalletDB')
    this.wallet = container.resolve("Wallet")
    this.server = container.resolve("RPCServer")
  }

  public async run () {
    try {
      await this.wallet.load(this.cfg.walletDBPath)
    } catch {
      throw new Error('failed to load Wallet !')
    }

    this.server.start(this.wallet, this.cfg)
  }
}

import container from './container'
import * as program from "commander";
import {Config, WalletServiceOpts} from "./config";
import WalletDB from "./walletdb";
import {BasicWallet} from './wallet'
import GRPCServer from "./rpc_server";
import {BasicKeystore} from "./keystore";
import {RPC} from 'blockchain-proxy';
import {DecryptStream, EncryptStream} from "./stream";


// facade class of wallet.
// This is just one example of very basic wallet.
// You may compose different kind of Classes and create different kinds of wallet.
// e.g. wallet for managing community funds, wallet which uses external HD Key for signing, etc.
export default class WalletService {
  public cfg: Config;
  private walletdb: WalletDB<EncryptStream, DecryptStream>;
  private wallet: BasicWallet<RPC, BasicKeystore>;
  private server: GRPCServer;

  constructor(opts: WalletServiceOpts) {
    this.cfg = container.cradle.loadConfig(opts)
    this.walletdb = container.cradle.WalletDB(
      container.cradle.WalletOutStraem,
      container.cradle.WalletInStream,
      this.cfg
    );
    this.wallet = container.cradle.Wallet(
      container.cradle.proxy,
      container.cradle.Keystore,
      this.walletdb,
      container.cradle.BackendProxy
    );
    this.server = container.cradle.RPCServer
  }

  public async run () {
    try {
      await this.wallet.load()
    } catch {
      throw new Error('failed to load Wallet !')
    }

    this.server.start(this.wallet, this.cfg)
  }
}

let cli: WalletServiceOpts = program
  .version('0.0.1')
  .option('-d, --datadir', 'data directory')
  .option('--debug-file', 'file to output debug info')
  .option('--conf', 'config file')
  .parse(process.argv)

(async function main() {
  let service = new walletService(cli)
  service.run()
})();
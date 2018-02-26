import container from './container'
import {Config, default as loadConfig, WalletServiceOpts} from "./config";
import WalletDB from "./walletdb";
import {BasicWallet} from './wallet'
import GRPCServer from "./rpc_server";
import {BasicKeystore} from "./keystore";
import {RPC} from 'blockchain-proxy';
import {DecryptStream, EncryptStream} from "./stream";
import {ParseOptionsResult} from "commander";
const program = require("commander");


// facade class of wallet.
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
    /*
    container.cradle.WalletDB(
      EncryptStream,
      DecryptStream,
      this.cfg
    );
    */
    this.wallet = container.resolve("Wallet")

      /*container.cradle.Wallet(
      container.cradle.proxy,
      container.cradle.Keystore,
      this.walletdb,
      container.cradle.BackendProxy
    );
    */
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

let cli = program
  .version('0.0.1')
  .option('-d, --datadir', 'data directory')
  .option('--debug-file', 'file to output debug info')
  .option('--conf', 'config file')
  .option('--network', 'which network to be run ( testnet3|mainnet|regtest )')
  .option('--port', 'the port to which this wallet will listen')
  .parse(process.argv);

(async function main() {
  let datadir = cli.datadir;
  let debugFile = cli.debugFile;
  let conf = cli.conf;
  let service = new WalletService({datadir, debugFile, conf});
  service.run()
})();
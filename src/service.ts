import container from './container'
import * as program from "commander";
import {Command} from "commander";

export default class WalletService {
  constructor(opts: Cli) {
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

class Cli extends Command {
  public datadir: string;
  public debugFile: string;
  public conf: string;
}

let cli: Cli = program
  .version('0.0.1')
  .option('-d, --datadir', 'data directory')
  .option('--debug-file', 'file to output debug info')
  .option('--conf', 'config file')
  .parse(process.argv)

(async function main() {
  let service = new walletService(cli)
  service.run()
})();
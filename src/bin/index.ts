// main entry point for using this wallet from command line.

const program = require("commander");
import WalletService from "../service"

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
  try {
    await service.run()
  } catch (e) {
    console.log(e);
    process.exit(1)
  }
})();

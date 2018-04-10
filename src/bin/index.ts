// main entry point for using this wallet from command line.

import { Command } from 'commander';
import logger from '../lib/logger';
import WalletLauncher from './launcher';

const program = new Command();

const cli = program
  .version('0.0.1')
  .option('-d, --datadir', 'data directory')
  .option('--debug-file', 'file to output debug info')
  .option('--conf', 'config file')
  .option('--network', 'which network to be run ( testnet3|mainnet|regtest )')
  .option('--port', 'the port to which this wallet will listen')
  .parse(process.argv);

(async function main(): Promise<void> {
  const datadir = cli.datadir;
  const debugFile = cli.debugFile;
  const configFile = cli.conf;
  const service = new WalletLauncher({ datadir, debugFile, configFile });
  try {
    await service.run();
  } catch (e) {
    process.stderr.write(e.toString());
    process.exit(1);
  }
})();

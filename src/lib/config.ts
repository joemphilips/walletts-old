import * as btc from 'bitcoinjs-lib';
import { Command } from 'commander';
import * as ini from 'ini';
import { networkInterfaces } from 'os';
import * as path from 'path';

export interface Config {
  readonly debugLevel: 'debug' | 'info' | 'quiet';
  readonly datadir: string;
  readonly walletDBPath: string;
  readonly port: string;
  readonly debugFile: string;
  readonly network: btc.Network;
}

export class ConfigError extends Error {}

export interface WalletServiceOpts {
  readonly datadir?: string;
  readonly debugFile?: string;
  readonly conf?: string;
  readonly port?: string | number;
  readonly network?: string;
}

const defaultappHome: string =
  process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']  || "~/.walletts";
const defaultDataDir = path.join(defaultappHome, 'fireWallet');
const defaultDebugFile = path.join(defaultDataDir, 'debug.log');
const defaultConfigFile = path.join(defaultDataDir, 'wallet.conf');
const defaultPort = '58011';
const defaultDebugLevel = 'info';

export default function loadConfig(opts: WalletServiceOpts): Config {
  const dataDir = opts.datadir || defaultDataDir;
  const filePath = opts.conf || defaultConfigFile;
  const fileConf = ini.decode(filePath);
  const debugFile = opts.debugFile
    ? opts.debugFile
    : fileConf.debugFile ? fileConf.debugFile : defaultDebugFile;
  const networkstring = opts.network
    ? opts.network
    : fileConf.network ? fileConf.network : 'testnet3';
  const network =
    networkstring === 'mainnet'
      ? btc.networks.bitcoin
      : networkstring === 'testnet3' ? btc.networks.testnet : false;
  if (!network) {
    throw new ConfigError('network option for config is not good!');
  }
  const port = opts.port
    ? opts.port
    : fileConf.port ? fileConf.port : defaultPort;
  const walletDBPath = path.join(dataDir + 'walletdb');

  return {
    port,
    datadir: dataDir,
    walletDBPath,
    debugLevel: defaultDebugLevel,
    debugFile,
    network
  };
}

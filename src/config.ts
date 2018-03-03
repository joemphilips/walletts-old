import * as ini from 'ini'
import {Command} from "commander";
import * as btc from 'bitcoinjs-lib'
import {networkInterfaces} from "os";
const path = require('path')

export interface Config {
  debugLevel: "debug" | "info" | "quiet";
  datadir: string;
  walletDBPath: string;
  port: string;
  debugFile: string;
  network: btc.Network;
}

export class ConfigError extends Error {}

export interface WalletServiceOpts {
  datadir?: string;
  debugFile?: string;
  conf?: string;
  port?: string | number;
  network?: string
}

const defaultappHome: string | undefined = process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"]
const defaultDataDir = path.join(defaultappHome, 'fireWallet')
const defaultDebugFile = path.join(defaultDataDir, 'debug.log');
const defaultConfigFile = path.join(defaultDataDir, 'wallet.conf');
const defaultPort = '58011';
const defaultDebugLevel = 'info';

export default function loadConfig(opts: WalletServiceOpts): Config {
  const dataDir = opts.datadir || defaultDataDir;
  const filePath = opts.conf || defaultConfigFile;
  const fileConf = ini.decode(filePath);
  const debugFile =  opts.debugFile ? opts.debugFile
    : fileConf.debugFile ? fileConf.debugFile
    : defaultDebugFile;
  const networkstring = opts.network ? opts.network
    : fileConf.network ? fileConf.network
    : 'testnet3';
  let network = (networkstring === "mainnet") ? btc.networks.bitcoin
    : (networkstring === "testnet3") ? btc.networks.testnet
    : false;
  if (!network) {
    throw new ConfigError("network option for config is not good!");
  }
  const port = opts.port ? opts.port
    : fileConf.port ? fileConf.port
    : defaultPort;
  const walletDBPath = path.join(dataDir + "walletdb");

  return {
    port: port,
    datadir: dataDir,
    walletDBPath: walletDBPath,
    debugLevel: defaultDebugLevel,
    debugFile: debugFile,
    network: network,
  };
}

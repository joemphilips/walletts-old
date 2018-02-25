import * as ini from 'ini'
import {Command} from "commander";
import path from 'path'

export interface Config {
  debugLevel: "debug" | "info" | "quiet";
  datadir: string;
  walletDBPath: string;
  port: string;
}

const defaultappHome: string | undefined = process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"]
const defaultDataDir = path.join(defaultappHome, 'fireWallet')
const defaultDebugFile = path.join(defaultDataDir, 'debug.log');
const defaultConfigFile = path.join(defaultDataDir, 'wallet.conf');
const defaultPort = '58011';
const defaultDebugLevel = 'info';

export default function loadConfig(opts: Command): Config {
  const dataDir = opts.datadir || defaultDataDir;
  const filePath = opts.conf || defaultConfigFile;
  const fileConf = ini.decode(filePath);
  const debugFile =  opts.debugFile ? opts.debugFile
    : fileConf.debugFile ? fileConf.debugFile
    : defaultDebugFile;
  const network = opts.network ? opts.network
    : fileConf.network ? fileConf.network
    : 'testnet3';
  const port = opts.port ? opts.port
    : fileConf.port ? fileConf.port
    : defaultPort;
  const walletDBPath = path.join(dataDir + "walletdb");

  return {
    port: port,
    datadir: dataDir,
    walletDBPath: walletDBPath,
    debugLevel: defaultDebugLevel
  };
}


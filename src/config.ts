import * as ini from 'ini'
import {Command} from "commander";
import path from 'path'

export interface Config {
  debugLevel: "debug" | "info" | "quiet"
}

const defaultappHome: string = process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"]
const defaultDataDir = path.join(defaultappHome, 'fireWallet')
const defaultDebugFile = path.join(defaultDataDir, 'debug.log');
const defaultConfigFile = path.join(defaultDataDir, 'wallet.conf');

export default function loadConfig(opts: Command): Config {
  const dataDir = opts.datadir || defaultDataDir;
  const filePath = opts.conf || defaultConfigFile;
  const fileConf = ini.decode(filePath);
  const debugFile =  opts.debugFile ? opts.debugFile ? fileConf.debugFile : defaultDebugFile;
  const network = opts.network ? opts.network ? fileConf.debugFile : 'testnet3';
  return {
  }
}

a


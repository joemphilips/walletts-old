import * as ini from 'ini';
import * as path from 'path';
import * as fs from 'fs';
import * as nodeUrl from 'url';

export class ConfigError extends Error {}

export interface Config {
  readonly debugLevel: 'info' | 'debug' | 'trace';
  /**
   * Usually ~/.walletts/ under users home directory
   */
  readonly datadir: string;
  /**
   * Usually ${datadir}/debug.log
   */
  readonly debugFile: string;
  /**
   *  Usurally ${datadir}/walletdb
   */
  readonly walletDBPath: string;
  /**
   * Usually ${datadir}/wallet.conf
   */
  readonly configFile: string;
  /**
   * Usually 58011
   */
  readonly port: string | number;

  /**
   * Usually localhost
   */
  readonly ip: string | number;

  /**
   * port + ":" + "ip"
   * TODO: make url type safe
   */
  readonly url: string;

  /**
   * specify which blockchain to use.
   */
  readonly network: 'mainnet' | 'testnet3';
}

// paths
const defaultappHome: string =
  process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] ||
  __dirname;
const defaultDataDir = path.join(defaultappHome, '.walletts');
const defaultDebugFile = path.join(defaultDataDir, 'debug.log');
const defaultConfigFile = path.join(defaultDataDir, 'wallet.conf');
const defaultWalletDBPath = path.join(defaultDataDir, 'walletdb');

// networks
const defaultPort = '58011';
const defaultDebugLevel = 'info';

const defaultMap: Config = {
  // paths
  datadir: defaultDataDir,
  debugFile: defaultDebugFile,
  debugLevel: 'info',
  configFile: defaultConfigFile,
  walletDBPath: defaultWalletDBPath,

  // networks
  port: defaultPort,
  ip: 'localhost',
  url: 'locahost:' + defaultPort,
  network: 'testnet3'
};

function takeWithPriority<K extends keyof Config>(
  opts: Partial<Config>,
  fileConf: any,
  k: K
): Config[K] {
  return opts[k] ? opts[k] : fileConf[k] ? fileConf[k] : defaultMap[k];
}

/**
 * setup global configuration object.
 * priority is
 * 1. field specified directly by opts (mostly this is the command line arguments given by the user)
 * 2. field defined in opts.conf (global configuration file)
 * 3. default value
 *
 * @param {Config} opts ... option to override default
 * @returns {Config}
 */
export default function loadConfig(opts: Partial<Config>): Config {
  // paths
  const datadir = opts.datadir || defaultDataDir;
  const configFile =
    opts.configFile && fs.existsSync(opts.configFile)
      ? opts.configFile
      : defaultConfigFile;

  const fileConf = ini.decode(configFile);

  const debugFile = takeWithPriority(opts, fileConf, 'debugFile');
  const debugLevel = takeWithPriority(opts, fileConf, 'debugLevel');
  const walletDBPath = takeWithPriority(opts, fileConf, 'walletDBPath');

  // networks
  const network = takeWithPriority(opts, fileConf, 'network');
  const port = takeWithPriority(opts, fileConf, 'port');
  const ip = takeWithPriority(opts, fileConf, 'ip');
  const url = ip + ':' + port;

  if (!nodeUrl.parse(url)) {
    throw new ConfigError(`Invalid URL ${url} !`);
  }

  return {
    // paths
    datadir,
    configFile,
    debugFile,
    debugLevel,
    walletDBPath,

    // networks
    network,
    port,
    ip,
    url
  };
}

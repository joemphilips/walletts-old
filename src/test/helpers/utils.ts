import { WalletOpts } from '../../lib/wallet';
import loadConfig, { ConfigOverrideOpts } from '../../lib/config';
import { Config } from '../../';
import { mkdirp } from 'fs-extra';
import * as path from 'path';
import * as fs from 'fs';

const tmpDir = path.join(__dirname, '..', 'tmp');
const testConfFilePath = path.join(__dirname, '..', 'fixtures', 'test.conf');

export async function loadWalletConf(testSuiteName: string): Promise<Config> {
  const datadir = path.join(tmpDir, testSuiteName);
  // create datadir if it does not exist.
  if (!fs.existsSync(datadir)) {
    await mkdirp(datadir);
  }
  const debugLog = path.join(datadir, 'debug.log');
  const opts: Partial<ConfigOverrideOpts> = {
    datadir,
    debugFile: debugLog,
    port: 0 // random port
  };

  return loadConfig(opts);
}

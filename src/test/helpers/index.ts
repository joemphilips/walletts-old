import * as cp from 'child_process';
import * as Logger from 'bunyan';
import * as path from 'path';
import { mkdirpSync } from 'fs-extra';
import getLogger from '../../lib/logger';

export const testBitcoindUsername = 'foo';
export const testBitcoindPassword = 'bar';
export const testBitcoindIp = 'localhost';
export const testBitcoindPort = '18332';

export async function startTestBitcoind(logger: Logger): Promise<null> {
  const log = logger.child({ subProcess: 'bitcoind' });
  const process = await cp.spawn('bitcoind', [
    '-printtoconsole',
    '-regtest',
    `-rest`,
    `-rpcuser=${testBitcoindUsername}`,
    `-rpcpass=${testBitcoindPassword}`,
    `-rpcport=${testBitcoindPort}`,
    `-rpcallowip=172.17.0.0/16`,
    `-rpcallowip=192.168.0.0/16`,
    `-rpcallowip=10.211.0.0/16`
  ]);
  process.stdout.on('data', d => {
    log.info(d.toString());
  });
  process.stderr.on('data', d => {
    log.error(d.toString());
  });
  return null;
}

export function prePareTest(): [Logger, string] {
  const dataDir = setupTestDir();
  const debugFile = path.join(dataDir, 'test.log');
  const logger = getLogger(debugFile);
  logger.warn(`create ${dataDir} for testing ...`);
  logger.warn(`debug log will be output to ${debugFile}`);
  return [logger, dataDir];
}

export function setupTestDir(): string {
  const Home: string =
    process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] ||
    __dirname;
  const dataDir = path.join(Home, '.walletts-test');
  mkdirpSync(dataDir);
  return dataDir;
}

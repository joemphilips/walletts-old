import * as cp from 'child_process';
import * as Logger from 'bunyan';
import * as path from 'path';
import { mkdirpSync } from 'fs-extra';
import getLogger from '../../lib/logger';
import * as ps from 'ps-node';
import * as util from 'util';
import _ from 'lodash';
import { existsSync } from 'fs';

export const testBitcoindUsername = 'foo';
export const testBitcoindPassword = 'bar';
export const testBitcoindIp = 'localhost';
export const testBitcoindPort = '18332';
export const testZmqPubUrl = 'tcp://127.0.0.1:28332';

export const sleep = (msec: number) =>
  new Promise(resolve => setTimeout(resolve, msec));

export async function startTestBitcoind(logger: Logger): Promise<null> {
  const log = logger.child({ subProcess: 'bitcoind' });
  const bitcoindArgs = [
    '-printtoconsole',
    '-regtest',
    `-rest`,
    `-rpcuser=${testBitcoindUsername}`,
    `-rpcpass=${testBitcoindPassword}`,
    `-rpcport=${testBitcoindPort}`,
    `-rpcallowip=172.17.0.0/16`,
    `-rpcallowip=192.168.0.0/16`,
    `-rpcallowip=10.211.0.0/16`,
    `-zmqpubrawblock=${testZmqPubUrl}`,
    `-zmqpubrawtx=${testZmqPubUrl}`
  ];
  const lookup = util.promisify(ps.lookup);
  const resultList = await lookup({
    command: 'bitcoind'
  });
  log.trace(`resultList was ${JSON.stringify(resultList)}`);
  resultList.forEach((r: any) => {
    if (_.isEqual(r.arguments[0], bitcoindArgs[0])) {
      log.info(
        `there were already running bitcoind, so not going to starting new one.`
      );
      return null;
    } else {
      log.error(`bitcoind has already been running by different process!
                 Please shut down before test.`);
      throw new Error(`Failed to start regtest bitcoind for test`);
    }
  });
  const p = await cp.spawn('bitcoind', bitcoindArgs);
  p.stdout.on('data', d => {
    log.info(d.toString());
  });
  p.stderr.on('data', d => {
    log.error(d.toString());
  });
  process.on('exit', () => {
    log.info(`going to shut down bitcoind ...`);
    p.kill();
  });
  return null;
}

export function prePareTest(): [Logger, string] {
  const dataDir = setupTestDir();
  const debugFile = path.join(dataDir, 'test.log');
  const logger = getLogger(debugFile);
  logger.info(`debug log will be output to ${debugFile}`);
  return [logger, dataDir];
}

export function setupTestDir(): string {
  const Home: string =
    process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] ||
    __dirname;
  const dataDir = path.join(Home, '.walletts-test');
  existsSync(dataDir)
    ? mkdirpSync(dataDir)
    : util.debuglog(`${dataDir} already exists. so not creating`);
  return dataDir;
}

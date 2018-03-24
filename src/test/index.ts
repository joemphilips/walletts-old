import anyTest, { default as test, TestInterface } from 'ava';
import { default as loadConfig } from '../lib/config';
import getClient, { RPCClient } from '../bin/grpc-client';
import GRPCServer, { RPCServer } from '../bin/grpc-server';
import WalletRepository from '../lib/wallet-repository';
import { Config } from '../lib/config';
import { mkdirpSync } from 'fs-extra';
import getLogger from '../lib/logger';
import * as path from 'path';

const sleep = (msec: number) =>
  new Promise(resolve => setTimeout(resolve, msec));

let service: RPCServer;
let testConfig: Config;
test.before(async t => {
  const Home: string =
    process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] ||
    __dirname;
  const dataDir = path.join(Home, '.walletts-test');
  mkdirpSync(dataDir);
  const debugFile = path.join(dataDir, 'test.log');
  const logger = getLogger(debugFile);
  logger.warn(`debug log will be output to ${debugFile}`);
  logger.warn(`create ${dataDir} for testing ...`);
  service = new GRPCServer(logger);
  testConfig = loadConfig({ datadir: dataDir });
  const repo = new WalletRepository(testConfig, logger);
  service.start(repo, testConfig);
  await sleep(1000);
});

test('wallet service has been started', async t => {
  t.truthy(service);
});

test.cb('It can respond to PingRequest', t => {
  const client: RPCClient = getClient(testConfig.url);
  client.ping(undefined, (err, res) => {
    if (err) {
      throw new Error('error while pinging to the server');
    }
    t.is(res.message, 'ACK!');
    t.end();
  });
});

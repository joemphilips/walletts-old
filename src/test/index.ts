import anyTest, { default as test, TestInterface } from 'ava';
import { default as loadConfig, WalletServiceOpts } from '../lib/config';
import getClient, { RPCClient } from '../bin/grpc-client';
import GRPCServer, { RPCServer } from '../bin/grpc-server';
import WalletRepository from '../lib/wallet-repository';
import { Config } from '../lib/config';
import { mkdirpSync } from 'fs-extra';

let service: RPCServer;
let testConfig: Config;

test.before(t => {
  service = new GRPCServer();
  const dataDir = '~/.walletts/test-tmp';
  t.log(`create ${dataDir} for testing ...`);
  mkdirpSync(dataDir);
  testConfig = loadConfig({ datadir: dataDir });
  const repo = new WalletRepository(testConfig);
  service.start(repo, testConfig);
  setTimeout(() => {
    t.log(`finished waiting 1000ms after starting server`);
  }, 1000);
});

test('wallet service has been started', async t => {
  t.truthy(service);
});

test.cb('It can respond to PingRequest', t => {
  const client: RPCClient = getClient(testConfig.port);
  client.ping(undefined, (err, res) => {
    if (err) {
      throw new Error('error while pinging to the server');
    }
    t.is(res.message, 'ACK!');
    t.end();
  });
});

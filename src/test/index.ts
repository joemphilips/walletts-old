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
});

test('wallet service has been started', async t => {
  t.truthy(service);
});

test('It can respond to PingRequest', async t => {
  const client: RPCClient = getClient(testConfig.port);
  client.ping(null, (err, res) => {
    t.falsy(err, 'error while pinging to the server');
    t.is(res.message, 'ACK!');
  });
});

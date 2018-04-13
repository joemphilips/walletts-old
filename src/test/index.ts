import anyTest, { default as test, TestInterface } from 'ava';
import { default as loadConfig, Config } from '../lib/config';
import getClient, { RPCClient } from '../bin/grpc-client';
import GRPCServer, { RPCServer } from '../bin/grpc-server';
import WalletService from '../lib/wallet-service';
import * as Logger from 'bunyan';
import { BasicWallet } from '../lib/wallet';
import { bchInfoSource, grpcNetworkInfo } from '..//bin/grpc-common';
import {
  prePareTest,
  sleep,
  testBitcoindIp,
  testBitcoindPassword,
  testBitcoindPort,
  testBitcoindUsername,
  testZmqPubUrl
} from './helpers';
import { InMemoryKeyRepository } from '../lib/key-repository';
import WalletRepository from '../lib/wallet-repository';

let service: RPCServer<BasicWallet>;
let testConfig: Config;
let logger: Logger;

test.before(async t => {
  let dataDir: string;
  [logger, dataDir] = prePareTest();
  service = new GRPCServer(logger);
  testConfig = loadConfig({ datadir: dataDir });
  const keyRepo = new InMemoryKeyRepository();
  const repo = new WalletService(
    testConfig,
    keyRepo,
    new WalletRepository(),
    logger
  );
  service.start(repo, testConfig);
  await sleep(400); // to make sure server has started
});

test('wallet service has been started', async t => {
  t.truthy(service);
});

test.cb('It can respond to PingRequest', t => {
  const client: RPCClient = getClient(testConfig.url);
  client.ping(undefined, (e, r) => {
    if (e) {
      t.fail(e.toString());
    }
    t.is(r.message, 'ACK!');
    t.end();
  });
});

test.cb('It can create Wallet only by nameSpace', t => {
  const client: RPCClient = getClient(testConfig.url);
  client.createWallet({ nameSpace: 'testNameSpace' }, (e, r) => {
    if (e) {
      logger.error(
        `received this error from WalletServer.createWallet ${e.toString()}`
      );
      t.fail('Error while creating Wallet');
    }
    t.true(r.success, `received ${r} from server`);
    t.end();
  });
});

test.cb('It can set blockchainProxy after creating Wallet', t => {
  const client: RPCClient = getClient(testConfig.url);
  client.createWallet(
    { nameSpace: 'testNameSpace', network: grpcNetworkInfo.btctest },
    (e, r) => {
      if (e) {
        logger.error(
          `received this error from WalletServer.createWallet ${e.toString()}`
        );
        t.fail('Error while creating Wallet');
      }
      t.true(r.success, `received ${r} from server`);

      client.setupBlockchainProxy(
        {
          type: bchInfoSource.trusted_rpc,
          rpcusername: testBitcoindUsername,
          rpcpass: testBitcoindPassword,
          rpcip: testBitcoindIp,
          rpcport: testBitcoindPort,
          zmqurl: testZmqPubUrl
        },
        (err, res) => {
          if (err) {
            logger.error(
              `received following error from WalletServer ${err.toString()}`
            );
            t.fail(`Error while setting blockchain proxy`);
          }
          t.true(res.success, `received ${JSON.stringify(res)} from server`);
          t.end();
        }
      );
    }
  );
});

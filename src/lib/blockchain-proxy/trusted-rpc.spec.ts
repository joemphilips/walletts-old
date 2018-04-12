import test from 'ava';
import {
  prePareTest,
  testBitcoindIp,
  testBitcoindPassword,
  testBitcoindPort,
  testBitcoindUsername
} from '../../test/helpers';
import { TrustedBitcoindRPC } from '../blockchain-proxy/trusted-rpc';

let proxy: TrustedBitcoindRPC;
test.before('It can be ', async t => {
  const [logger, datadir] = prePareTest();
  proxy = new TrustedBitcoindRPC(
    '',
    testBitcoindUsername,
    testBitcoindPassword,
    testBitcoindIp,
    testBitcoindPort,
    logger
  );
});

test('ping', async t => {
  await proxy.ping();
  t.pass();
});

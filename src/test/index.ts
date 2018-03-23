import anyTest, { ExecutionContext, TestInterface } from 'ava';
import WalletLauncher from '../bin/service';
import { WalletServiceOpts } from '../lib/config';
import { AwilixResolutionError } from 'awilix';
import * as path from 'path'

interface TestWalletLauncherContext {
  service: WalletLauncher;
};
const test = anyTest as TestInterface<TestWalletLauncherContext>;
let service: WalletLauncher;

test.before((t: ExecutionContext<TestWalletLauncherContext>) => {
  const opts: WalletServiceOpts = {
    datadir: path.join(__dirname, 'tmp'),
    debugFile: './tmp/debug.log',
    conf: './fixtures/test.conf'
  };
  service = new WalletLauncher(opts);
});

test.only('wallet service has been started', async t => {
  t.truthy(service);
});

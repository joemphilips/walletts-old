import anyTest, {ExecutionContext, TestInterface} from 'ava';
import WalletService from '../src/service';
import {WalletServiceOpts} from "../src/config";

type testWalletServiceContext = {
  service: WalletService;
}
const test = anyTest as TestInterface<testWalletServiceContext>

test.before((t: ExecutionContext<testWalletServiceContext>) => {
  let opts: WalletServiceOpts = {
    datadir: "./tmp",
    debugFile: "./tmp/debug.log",
    conf: "./fixtures/test.conf"
  };
  t.context.service = new WalletService(opts)
})

test.only("wallet service", async t => {
  t.truthy(t.context.service)
})
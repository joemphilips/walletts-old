import anyTest, {ExecutionContext, TestInterface} from 'ava';
import WalletService from '../src/bin/service';
import {WalletServiceOpts} from "../src/config";
import {AwilixResolutionError} from "awilix";
const path = require('path');

type testWalletServiceContext = {
  service: WalletService;
}
const test = anyTest as TestInterface<testWalletServiceContext>
let service: WalletService;

test.before((t: ExecutionContext<testWalletServiceContext>) => {
  let opts: WalletServiceOpts = {
    datadir: path.join(__dirname, "tmp"),
    debugFile: "./tmp/debug.log",
    conf: "./fixtures/test.conf"
  };
  service = new WalletService(opts)
});

test.only("wallet service", async t => {
  t.truthy(service)
});
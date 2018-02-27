import anyTest, {ExecutionContext, TestInterface} from 'ava'
import WalletDB from "../src/walletdb";
import {MockInStream, MockOutStream} from "./helpers/mocks/mock-stream";
import container from "../src/container";
import {WalletOpts} from "../src/wallet";
import loadConfig from "../src/config";
import {loadWalletConf} from "./helpers/utils";

type  WalletDBTestContext = {
  db: WalletDB<MockOutStream, MockInStream>;
}

const test = anyTest as TestInterface<WalletDBTestContext>

test.beforeEach((t: ExecutionContext<WalletDBTestContext>) => {
  t.context.db = new WalletDB(new MockOutStream(), new MockInStream(), loadWalletConf("walletdb"))
});

test("wallet db can be created", (t: ExecutionContext<WalletDBTestContext>) => {
  t.pass()
})
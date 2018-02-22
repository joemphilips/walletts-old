import test from 'ava';
import WalletService from '../src/service';
const path = require('path')
const Mali = require('mali')

// mock server handler
async function ping (ctx: any) {
  ctx.res = { message: 'hello'.concat(ctx.req.name) }
}

// mock server
function main () {
  const app = new Mali(PROTO_PATH);
  app.use( ping );
  app.start('127.0.0.1:50051');
};

// start mock server
const PROTO_PATH = path.resolve(__dirname, '../backendserver.proto')
test.before(t => {
  main();
})

test("service", async t => {
  t.is(3, 1+2)
})
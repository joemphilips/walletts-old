import {TestContext} from "ava";
const path = require('path')
const Mali = require('mali')

export const url = '127.0.0.1:50051';

// mock server handlers
async function ping (ctx: any) {
  ctx.res = { message: 'hello'.concat(ctx.req.name) }
}

// mock server
function main () {
  const app = new Mali(PROTO_PATH);
  app.use( ping );
  app.start(url);
};

// start mock server
const PROTO_PATH = path.resolve(__dirname, '../../proto/backendserver.proto');

export default function startMockServer(test: any) {
  test.before("starting mock backend server", (t: TestContext) => {
    main();
  })
}

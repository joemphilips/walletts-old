import {TestContext} from "ava";

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
const PROTO_PATH = path.resolve(__dirname, '../../backendserver.proto')

export default function startMockServer(test: any) {
  test.before("starting mock backend server", (t: TestContext) => {
    main();
  })
}

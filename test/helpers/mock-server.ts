import log from './logger'

const path = require('path')
const Mali = require('mali')

export const url = '127.0.0.1:50051';
const PROTO_PATH = path.resolve(__dirname, '../../proto/backendserver.proto');

// handlers
async function ping (ctx: any) {
  log.info(`received ping message ${ctx}`);
  ctx.res = { message: 'hello'.concat(ctx.req.getMessage()) }
}

export default function startMockServer () {
  console.log("starting mock server ... ")
  const app = new Mali(PROTO_PATH);
  app.use( {ping} );
  app.start(url);
  console.log("mock server started ")
};

startMockServer()

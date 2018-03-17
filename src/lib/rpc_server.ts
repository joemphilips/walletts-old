import * as grpc from 'grpc';
import * as path from 'path';
import { Config } from './config';
import { AbstractWallet } from './wallet';
const PROTO_PATH = path.join(__dirname, '..', 'proto', 'walletserver.proto');
import logger from './logger';

const walletServiceHandlers = {
  ping(call: any, cb: (a: any, b: any) => { readonly c: any }): void {
    logger.info('received ping message ', call.request);
    cb(null, { message: 'hello! ' + call.request.message });
  }
};

export default class GRPCServer {
  private readonly descriptor: any;
  constructor() {
    logger.info('going to load from ', PROTO_PATH);
    this.descriptor = grpc.load(PROTO_PATH);
  }
  public start<W extends AbstractWallet>(w: W, cfg: Config): void {
    const walletServer = new grpc.Server();
    walletServer.addService(
      this.descriptor.walletservice,
      walletServiceHandlers
    );

    walletServer.bind(cfg.port, grpc.ServerCredentials.createInsecure());
    walletServer.start();
  }
}

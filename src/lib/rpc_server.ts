import grpc from 'grpc';
import path from 'path';
import { Config } from './config';
import { AbstractWallet } from './wallet';
const PROTO_PATH = path.join(__dirname, '..', 'proto', 'walletserver.proto');
import logger from './logger';

const walletServiceHandlers = {
  ping(call: any, cb: (a: any, b: any) => { c: any }) {
    logger.info('received ping message ', call.request);
    cb(null, { message: 'hello! ' + call.request.message });
  }
};

export default class GRPCServer {
  private descriptor: any;
  constructor() {
    logger.info('going to load from ', PROTO_PATH);
    this.descriptor = grpc.load(PROTO_PATH);
  }
  public start<W extends AbstractWallet>(w: W, cfg: Config) {
    const walletServer = new grpc.Server();
    walletServer.addService(
      this.descriptor.walletservice,
      walletServiceHandlers
    );

    walletServer.bind(cfg.port, grpc.ServerCredentials.createInsecure());
    walletServer.start();
  }
}

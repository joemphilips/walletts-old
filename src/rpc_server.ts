import * as grpc from 'grpc'
import path from 'path'
const PROTO_PATH = path.join("..", "proto", "walletserver.proto")
import {AbstractWallet} from './wallet'
import {Config} from "./config";

export default class GRPCServer {
  public constructor() {
    this.discrptor = grpc.load(PROTO_PATH)
  }
  public start<W extends AbstractWallet> (w: W, cfg: Config) {
    let WalletServer = grpc.buildServer([this.discriptor.walletservice]);
    let server = new WalletServer({
      "wallet": {
        // TODO: Write handler here
      }
    });

    server.bind(cfg.port);
    server.listen();
  }
}
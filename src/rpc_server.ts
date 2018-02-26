import * as grpc from 'grpc'
import {AbstractWallet} from './wallet'
import {Config} from "./config";
import {GrpcObject} from "grpc";
const path =  require('path')
const PROTO_PATH = path.join(__dirname, "..", "proto", "walletserver.proto")


const walletServiceHandlers = {
  ping: function (call: any, cb: Function) {
    console.log("received ping message ", call.request);
    cb(null, {message: "hello! " + call.request.message})
  }
}

export default class GRPCServer {
  private _descriptor: GrpcObject;
  constructor() {
    console.log("going to load from ", PROTO_PATH)
    this._descriptor = grpc.load(PROTO_PATH);
  }
  public start<W extends AbstractWallet> (w: W, cfg: Config) {
    let walletServer = new grpc.Server();
    walletServer.addService(this._descriptor.walletservice, walletServiceHandlers);

    walletServer.bind(cfg.port, grpc.ServerCredentials.createInsecure());
    walletServer.start();
  }
}
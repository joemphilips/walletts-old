// package: lighthouse
// file: walletserver.proto

import * as walletserver_pb from "./walletserver_pb";
export class WalletService {
  static serviceName = "lighthouse.WalletService";
}
export namespace WalletService {
  export class Ping {
    static readonly methodName = "Ping";
    static readonly service = WalletService;
    static readonly requestStream = false;
    static readonly responseStream = false;
    static readonly requestType = walletserver_pb.PingRequest;
    static readonly responseType = walletserver_pb.PingResponse;
  }
  export class CreateWallet {
    static readonly methodName = "CreateWallet";
    static readonly service = WalletService;
    static readonly requestStream = false;
    static readonly responseStream = false;
    static readonly requestType = walletserver_pb.CreateWalletRequest;
    static readonly responseType = walletserver_pb.CreateWalletResponse;
  }
}

// package: LighthouseWallet
// file: walletserver.proto

import * as walletserver_pb from "./walletserver_pb";
export class WalletService {
  static serviceName = "LighthouseWallet.WalletService";
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
  export class createWallet {
    static readonly methodName = "createWallet";
    static readonly service = WalletService;
    static readonly requestStream = false;
    static readonly responseStream = false;
    static readonly requestType = walletserver_pb.createWalletRequest;
    static readonly responseType = walletserver_pb.createWalletResponse;
  }
}

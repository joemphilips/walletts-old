// package: LighthouseServer
// file: backendserver.proto

import * as backendserver_pb from "./backendserver_pb";
export class PaymentService {
  static serviceName = "LighthouseServer.PaymentService";
}
export namespace PaymentService {
  export class Ping {
    static readonly methodName = "Ping";
    static readonly service = PaymentService;
    static readonly requestStream = false;
    static readonly responseStream = false;
    static readonly requestType = backendserver_pb.PingRequest;
    static readonly responseType = backendserver_pb.PingResponse;
  }
}
export class CrowdFundingService {
  static serviceName = "LighthouseServer.CrowdFundingService";
}
export namespace CrowdFundingService {
  export class CreateCommunityWallet {
    static readonly methodName = "CreateCommunityWallet";
    static readonly service = CrowdFundingService;
    static readonly requestStream = false;
    static readonly responseStream = false;
    static readonly requestType = backendserver_pb.CommunityWalletCommitment;
    static readonly responseType = backendserver_pb.ACK;
  }
  export class Ping {
    static readonly methodName = "Ping";
    static readonly service = CrowdFundingService;
    static readonly requestStream = false;
    static readonly responseStream = false;
    static readonly requestType = backendserver_pb.PingRequest;
    static readonly responseType = backendserver_pb.PingResponse;
  }
}

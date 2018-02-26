// grpc client which speaks to backend service from browser.
// it also works as a Subject pattern which accepts observer and notify the wallet about when ...
//  1. it gets offline.
//  2. it receives push notifications from server.
import {EventEmitter2 as EventEmitter} from "eventemitter2"
import {grpc} from 'grpc-web-client';
import {CrowdFundingService, PaymentService} from '../../generated/backendserver_pb_service'
import * as message from '../../generated/backendserver_pb'
import Request = grpc.Request;
import ProtobufMessage = grpc.ProtobufMessage;
import UnaryOutput = grpc.UnaryOutput;

export default class BackendProxyWeb extends EventEmitter {
  public url: string;
  constructor(opts: any){
    super(opts);
    this.url = !opts.url.startsWith('http') ? 'http://' + opts.url : opts.url;
    this.on('backend:receivePSBT', (payload) => {
      this._receivePSBT(payload)
    })
  };

  public ping(): Request {
    const request = new message.PingRequest();
    request.setMessage("this is ping message!")
    console.log(`going to ping to ${this.url} with request ${request}`)
    return grpc.unary(CrowdFundingService.Ping, {
      request: request,
      host: this.url,
      onEnd: ({status, statusMessage, headers, message, trailers})=> {
        console.log("received pong from server", status, statusMessage, headers, message, trailers)
      }
    })
  }

  _receivePSBT(payload: any) {
    throw new Error(`_receivePSBT not implemented yet! but got payload ${payload}`)
  }
}

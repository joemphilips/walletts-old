// grpc client which speaks to backend service from browser.
import {EventEmitter2 as EventEmitter} from "eventemitter2"
import {grpc} from 'grpc-web-client';
import {CrowdFundingService, PaymentService} from '../../generated/backendserver_pb_service'
import * as message from '../../generated/backendserver_pb'
import Request = grpc.Request;

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
    console.log(`going to ping to ${this.url}`)
    return grpc.unary(CrowdFundingService.Ping, {
      request: request,
      host: this.url,
      onEnd: res => {
        console.log(`received pong from server \n ${res}`)
      }
    })

  }

  _receivePSBT(payload: any) {
    throw new Error(`_receivePSBT not implemented yet! but got payload ${payload}`)
  }
}

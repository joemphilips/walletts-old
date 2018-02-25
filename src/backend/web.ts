// grpc client which speaks to backend service from browser.
import {EventEmitter2 as EventEmitter} from "eventemitter2"
import {grpc} from 'grpc-web-client';
import {CrowdFundingService, PaymentService} from '../../generated/backendserver_pb_service'
import * as message from '../../generated/backendserver_pb'

export default class BackendProxyWeb extends EventEmitter {
  public url: string;
  constructor(opts: any){
    super(opts);
    this.url = opts.url;
    this.on('backend:receivePSBT', (payload) => {
      this._receivePSBT(payload)
    })
  };

  public ping() {
    const request = new message.PingRequest();
    grpc.unary(CrowdFundingService.Ping, {
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

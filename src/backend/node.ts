// grpc client which speaks to backend service.
import {EventEmitter} from "eventemitter2"
import axios from 'axios';
import grpc from 'grpc';

export default class BackendProxy extends EventEmitter {
  constructor(opts: any){
    super(opts);
    this.on('backend:receivePSBT', (payload) => {
      this._receivePSBT(payload)
    })
  };

  public ping() {

  }

  _receivePSBT()  {
  }
}

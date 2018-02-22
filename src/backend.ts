// grpc client which speaks to backend service.
import {EventEmitter} from "eventemitter2";

export default class BackendProxy extends EventEmitter {
  constructor(opts){
    super(opts)
    this.on('backend:receivePSBT', (payload) => {
      this._receivePSBT(payload)
    })
  };

  _receivePSBT()  {
  }
}
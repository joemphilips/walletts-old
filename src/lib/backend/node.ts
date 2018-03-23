// grpc client which speaks to backend service.
import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import logger from '../logger';

export default class BackendProxy extends EventEmitter {
  constructor(opts: any) {
    super(opts);
    this.on('backend:receivePSBT', payload => {
      this._receivePSBT(payload);
    });
  }

  public _receivePSBT(payload: Buffer): void {
    logger.trace(`payload is ${payload}`);
    return;
  }
}

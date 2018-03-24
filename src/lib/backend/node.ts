// grpc client which speaks to backend service.
import { EventEmitter2 as EventEmitter } from 'eventemitter2';
import logger from '../logger';
import * as Logger from 'bunyan';

export default class BackendProxy extends EventEmitter {
  private readonly logger: Logger;
  constructor(opts: any, log: Logger) {
    super(opts);
    this.logger = log.child({ subModule: 'BackendProxy' });
    this.logger.trace(`setting up backend proxy...`);
    this.on('backend:receivePSBT', payload => {
      this._receivePSBT(payload);
    });
  }

  public _receivePSBT(payload: Buffer): void {
    this.logger.trace(`payload is ${payload}`);
    return;
  }
}

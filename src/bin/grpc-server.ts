import * as grpc from 'grpc';
import { Config } from '../lib/config';
import logger from '../lib/logger';
import WalletRepository from '../lib/wallet-repository';
import { PROTO_PATH } from './grpc-common';
import Mali, { Context } from 'mali';

export interface RPCServer {
  readonly start: (w: WalletRepository, cfg: Config) => void;
}

const createWalletServiceHandlers = (
  walletRepo: WalletRepository,
  cfg: Config,
  forMali: boolean = true
) => {
  if (forMali) {
    return {
      async ping(ctx: Context): Promise<void> {
        logger.info('received ping message ', ctx);
        ctx.res = { message: 'Hello!, ' + ctx.request.req };
      },

      async createWallet(
        nameSpace: string,
        passPhrase?: string,
        seed?: ReadonlyArray<string>
      ): Promise<void> {
        if (seed) {
          await walletRepo.createFromSeed(nameSpace, seed, passPhrase);
        } else {
          await walletRepo.createNew(nameSpace, passPhrase);
        }
        logger.info(`wallet created !`);
      }
    };
  } else {
    return {
      createWallet: (call: any, cb: (error: any, value: any) => void): void => {
        const { nameSpace, passPhrase } = call.request;
        if (call.request.seed) {
          walletRepo
            .createFromSeed(nameSpace, passPhrase, call.request.seed)
            .then(isSuccess => {
              if (!isSuccess) {
                throw new Error();
              }
              cb(null, isSuccess);
            })
            .catch(e => {
              logger.error('failed to createWallet!');
              cb(e, null);
            });
        } else {
          walletRepo.createNew(nameSpace, passPhrase);
        }
      }
    };
  }
};

/**
 * Map grpc methods to handlers
 */
export class MaliGRPCServer implements RPCServer {
  constructor() {
    logger.info('going to activate server using ', PROTO_PATH);
  }
  public start(w: WalletRepository, cfg: Config): void {
    const app = new Mali(PROTO_PATH);
    const handlers = createWalletServiceHandlers(w, cfg);
    app.use({ handlers });
  }
}

export default class GRPCServer implements RPCServer {
  private readonly descriptor: any;
  constructor() {
    logger.info('going to activate server using', PROTO_PATH);
    this.descriptor = grpc.load(PROTO_PATH).lighthouse;
  }
  public start(w: WalletRepository, cfg: Config): void {
    const handlers = createWalletServiceHandlers(w, cfg, false);
    const server = new grpc.Server();
    server.addService(this.descriptor.WalletService.service, handlers);
  }
}

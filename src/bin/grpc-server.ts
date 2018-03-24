import * as grpc from 'grpc';
import { Config } from '../lib/config';
import getLogger from '../lib/logger';
import WalletRepository from '../lib/wallet-repository';
import { PROTO_PATH } from './grpc-common';
import Mali, { Context } from 'mali';
import * as Logger from 'bunyan';

export interface RPCServer {
  readonly logger: Logger;
  readonly start: (w: WalletRepository, cfg: Config) => void;
}

const createWalletServiceHandlers = (
  walletRepo: WalletRepository,
  forMali: boolean = true,
  logger: Logger
) => {
  if (forMali) {
    return {
      async ping(ctx: Context): Promise<void> {
        logger.info('received ping message ', ctx);
        ctx.res = { message: 'ACK!' };
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
      ping: (_: any, cb: (e?: any, v?: any) => void): void => {
        logger.info('received ping message');
        cb(undefined, 'ACK!');
      },
      createWallet: (
        call: any,
        cb: (error?: any, value?: any) => void
      ): void => {
        const { nameSpace, passPhrase } = call.request;
        if (call.request.seed) {
          walletRepo
            .createFromSeed(nameSpace, passPhrase, call.request.seed)
            .then(isSuccess => {
              if (!isSuccess) {
                throw new Error();
              }
              cb(undefined, isSuccess);
            })
            .catch(e => {
              logger.error('failed to createWallet!');
              cb(e, undefined);
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
  public readonly logger: Logger;
  constructor(log: Logger) {
    this.logger = log.child({ subModule: 'grpc-Mali-server' });
    this.logger.info('going to activate server using ', PROTO_PATH);
  }
  public start(w: WalletRepository, cfg: Config): void {
    const app = new Mali(PROTO_PATH);
    const handlers = createWalletServiceHandlers(w, true, this.logger);
    app.use({ handlers });
  }
}

export default class GRPCServer implements RPCServer {
  public readonly logger: Logger;
  private readonly descriptor: any;
  constructor(log: Logger) {
    this.logger = log.child({ subModule: 'grpc-server' });
    this.logger.info('going to activate server using', PROTO_PATH);
    this.descriptor = grpc.load(PROTO_PATH).lighthouse;
  }
  public start(w: WalletRepository, cfg: Config): void {
    const handlers = createWalletServiceHandlers(w, false, this.logger);
    const server = new grpc.Server();
    server.addService(this.descriptor.WalletService.service, handlers);
    server.bind(cfg.url, grpc.ServerCredentials.createInsecure());
    server.start();
  }
}

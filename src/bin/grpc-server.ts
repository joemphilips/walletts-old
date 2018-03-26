import * as grpc from 'grpc';
import { Config } from '../lib/config';
import getLogger from '../lib/logger';
import WalletRepository from '../lib/wallet-repository';
import { PROTO_PATH } from './grpc-common';
import Mali, { Context } from 'mali';
import * as Logger from 'bunyan';
import maliLogger from 'mali-logger';

export interface RPCServer {
  readonly logger: Logger;
  readonly start: (w: WalletRepository, cfg: Config) => void;
}

const createWalletServiceHandlers = (
  walletRepo: WalletRepository,
  handlerLogger: Logger
) => {
  return {
    async ping(ctx: Context): Promise<void> {
      ctx.sendMetadata();
      handlerLogger.trace('received ping message ', ctx);
      ctx.res = { message: 'ACK!' };
    },

    async createWallet(ctx: Context): Promise<void> {
      handlerLogger.trace(
        `received createWallet request ${JSON.stringify(ctx.req)}`
      );
      const nameSpace: string = ctx.req.nameSpace;
      let isSuccess: boolean;
      if (ctx.req.seed && ctx.req.seed.length && ctx.req.seed.length !== 0) {
        isSuccess = await walletRepo.createFromSeed(
          nameSpace,
          ctx.req.seed,
          ctx.req.passPhrase
        );
      } else {
        isSuccess = await walletRepo.createNew(nameSpace, ctx.req.passPhrase);
      }
      if (isSuccess) {
        handlerLogger.info(`wallet created !`);
      } else {
        handlerLogger.info(`failed to create Wallet`);
      }
      ctx.res = { success: isSuccess };
    }
  };
};

export default class GRPCServer implements RPCServer {
  public readonly logger: Logger;
  constructor(log: Logger) {
    this.logger = log.child({ subModule: 'grpc-server' });
    this.logger.info('going to activate server using', PROTO_PATH);
  }
  public start(w: WalletRepository, cfg: Config): void {
    const handlers = createWalletServiceHandlers(w, this.logger);
    const app = new Mali(PROTO_PATH);
    app.use(maliLogger());
    app.use(handlers);
    app.start(cfg.url);
  }
}

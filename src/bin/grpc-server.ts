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
      handlerLogger.info('received ping message ', ctx);
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
      handlerLogger.info(`wallet created !`);
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

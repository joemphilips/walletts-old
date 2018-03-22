import * as grpc from 'grpc';
import {Config} from '../lib/config';
import logger from '../lib/logger';
import WalletRepository from '../lib/wallet-repository';
import {PROTO_PATH} from "./grpc-common";
import Mali from 'mali'


export interface RPCServer {
  readonly start: (w: WalletRepository, cfg: Config) => void
}

const createWalletServiceHandlers = (
  walletRepo: WalletRepository,
  cfg: Config
) => {
  return {
    async ping(ctx): Promise<void> {
      logger.info('received ping message ', ctx);
      ctx.res = {message: 'Hello!, ' + ctx.message}
    },

    async createWallet(nameSpace: string, passPhrase?: string): Promise<void> {
      await walletRepo.createNew(nameSpace, passPhrase);
      logger.info(`wallet created !`)
    },

    async importWallet(
      nameSpace: string,
      seed: ReadonlyArray<string>,
      passPhrase?: string
    ): Promise<void> {
      await walletRepo.createFromSeed(nameSpace, seed, passPhrase);
      logger.info(`wallet imported !`)
    }
  };
};

/**
 * Map grpc methods to handlers
 */
export default class GRPCServer implements RPCServer {
  private readonly descriptor: any;
  constructor() {
    logger.info('going to activate server using ', PROTO_PATH);
    this.descriptor = grpc.load(PROTO_PATH).lighthouse;
  }
  public start(w: WalletRepository, cfg: Config): void {
    const app = new Mali(PROTO_PATH)
    const handlers = createWalletServiceHandlers(w, cfg);
    app.use({handlers})
  }
}

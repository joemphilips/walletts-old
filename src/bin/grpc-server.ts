import * as grpc from 'grpc';
import * as path from 'path';
import {
  FailedToCreateWalletError,
  WalletError,
  WalletNotFoundError
} from '../';
import { Config } from '../lib/config';
import logger from '../lib/logger';
import { AbstractWallet } from '../lib/wallet';
import WalletRepository from '../lib/wallet-repository';
import { WalletAction } from './uiproxy';
export const PROTO_PATH = path.join(
  __dirname,
  '..',
  'proto',
  'walletserver.proto'
);

const createWalletServiceHandlers = (walletRepo: WalletRepository, cfg: Config) => {
  return {
    ping(call: any, cb: (a: any, b: any) => { readonly c: any }): void {
      logger.info('received ping message ', call.request);
      cb(null, { message: 'hello! ' + call.request.message });
    },

    async createWallet(nameSpace: string, passPhrase?: string): Promise<void> {
      walletRepo.createNew(nameSpace, passPhrase);
    },

    async importWallet(
      nameSpace: string,
      seed: ReadonlyArray<string>,
      passPhrase?: string
    ): Promise<void> {
      walletRepo.createFromSeed(nameSpace, seed, passPhrase);
    }
  };
};

/**
 * Map grpc methods to handlers
 */
export default class GRPCServer {
  private readonly descriptor: any;
  constructor() {
    logger.info('going to activate from ', PROTO_PATH);
    this.descriptor = grpc.load(PROTO_PATH).lighthouse;
  }
  public start(w: WalletRepository, cfg: Config): void {
    const walletServer = new grpc.Server();
    walletServer.addProtoService(
      this.descriptor.WalletService.service,
      createWalletServiceHandlers(w, cfg)
    );

    walletServer.bind(cfg.port, grpc.ServerCredentials.createInsecure());
    walletServer.start();
  }
}

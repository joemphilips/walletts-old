import { Config } from '../lib/config';
import WalletService from '../lib/wallet-service';
import { bchInfoSource, grpcNetworkInfo, PROTO_PATH } from './grpc-common';
import Mali, { Context } from 'mali';
import * as Logger from 'bunyan';
import maliLogger from 'mali-logger';
/* tslint:disable-next-line:no-submodule-imports */
import { Option } from '../lib/primitives/utils';
import { AbstractWallet, BasicWallet } from '../';
import {
  BlockchainProxy,
  getObservableBlockchain,
  ObservableBlockchain,
  TrustedBitcoindRPC
} from '../lib/blockchain-proxy';
import { networks } from 'bitcoinjs-lib';

export interface RPCServer<W extends AbstractWallet> {
  readonly logger: Logger;
  readonly start: (w: WalletService, cfg: Config) => void;
  wallet: Option<W>;
  bchproxy: Option<BlockchainProxy>;
  observableBlockchain: Option<ObservableBlockchain>;
}

const createWalletServiceHandlers = (
  walletService: WalletService,
  parent: RPCServer<BasicWallet>
) => {
  const handlerLogger: Logger = parent.logger;
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
      const network =
        ctx.req.network && ctx.req.network === grpcNetworkInfo.btcmain
          ? networks.bitcoin
          : ctx.req.network && ctx.req.network === grpcNetworkInfo.btctest
            ? networks.testnet
            : undefined;
      if (ctx.req.seed && ctx.req.seed.length && ctx.req.seed.length !== 0) {
        handlerLogger.debug(`going to create wallet from seed...`);
        parent.wallet = await walletService.createFromSeed(
          nameSpace,
          ctx.req.seed,
          network,
          ctx.req.passPhrase
        );
        parent.wallet =
          parent.bchproxy && parent.observableBlockchain
            ? await walletService.discoverAccounts(
                parent.wallet,
                parent.bchproxy as BlockchainProxy,
                parent.observableBlockchain
              )
            : parent.wallet;
      } else {
        parent.wallet = await walletService.createNew(
          nameSpace,
          network,
          ctx.req.passPhrase
        );
      }
      if (parent.wallet) {
        handlerLogger.info(`wallet created !`);
        ctx.res = { success: true };
      } else {
        handlerLogger.info(`failed to create Wallet`);
        ctx.res = { success: false };
      }
    },

    async setupBlockchainProxy(ctx: Context): Promise<void> {
      handlerLogger.trace(`received set`);
      const bchType = ctx.req.type;
      if (bchType === bchInfoSource.trusted_rpc || bchType === 'trusted_rpc') {
        const {
          conf_path,
          rpcusername,
          rpcpass,
          rpcip,
          rpcport,
          zmqurl
        } = ctx.req;
        parent.bchproxy = new TrustedBitcoindRPC(
          conf_path,
          rpcusername,
          rpcpass,
          rpcip,
          rpcport,
          handlerLogger
        );
        parent.observableBlockchain = getObservableBlockchain(zmqurl);
        try {
          await parent.bchproxy.ping();
          ctx.res = { success: true };
        } catch (e) {
          handlerLogger.warn(`blockchain seems to be unreachable...`);
          ctx.res = { success: false };
        }
      } else {
        handlerLogger.error(
          `this type of blockchain proxy is not supported yet! ${bchType}`
        );
        ctx.res = { success: false };
      }
    }
  };
};

export default class GRPCServer implements RPCServer<BasicWallet> {
  public readonly logger: Logger;
  public wallet: Option<BasicWallet>;
  public bchproxy: Option<BlockchainProxy>;
  public observableBlockchain: Option<ObservableBlockchain>;

  constructor(log: Logger) {
    this.logger = log.child({ subModule: 'grpc-server' });
    this.logger.info('going to activate server using', PROTO_PATH);
    this.wallet = null;
    this.bchproxy = null;
    this.observableBlockchain = null;
  }

  public start(w: WalletService, cfg: Config): void {
    const handlers = createWalletServiceHandlers(w, this);
    const app = new Mali(PROTO_PATH);
    app.use(maliLogger());
    app.use(handlers);
    app.start(cfg.url);
  }
}

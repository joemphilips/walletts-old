import { grpc as grpcWeb } from 'grpc-web-client';
/* tslint:disable:no-implicit-dependencies */
import { CreateWalletRequest, PingRequest } from '../proto/walletserver_pb';
import { WalletService } from '../proto/walletserver_pb_service';
import * as Logger from 'bunyan';

export interface CreateWalletArg {
  nameSpace: string;
  passPhrase: string;
  seed?: ReadonlyArray<string>;
}

export type GrpcCallback = (
  e: NodeJS.ErrnoException | undefined,
  r: any
) => void | undefined;

export class GRPCError extends Error {}

export interface RPCClient {
  ping: (cb: GrpcCallback) => void;
  createWallet: (arg: CreateWalletArg, cb: GrpcCallback) => void;
}

export default function getClient(url: string, logger: Logger): RPCClient {
  return {
    ping(cb: GrpcCallback): WalletService.Ping {
      return grpcWeb.invoke(WalletService.Ping, {
        request: new PingRequest(),
        host: url,
        onEnd: (code: grpcWeb.Code, msg: string | undefined) => {
          if (code === grpcWeb.Code.OK) {
            logger.info(`Got Response ${msg} from server`);
            cb(undefined, msg);
          } else {
            logger.error(`Server irresponsive... status code was ${code}`);
            cb(new GRPCError(`server did not respond to ping`), undefined);
          }
        }
      });
    },
    createWallet(
      arg: CreateWalletArg,
      cb: GrpcCallback
    ): WalletService.CreateWallet {
      const req = new CreateWalletRequest();
      req.setNamespace(arg.nameSpace);
      req.setPassphrase(arg.passPhrase);
      if (arg.seed) {
        req.setSeedList(arg.seed as string[]);
      }
      return grpcWeb.invoke(WalletService.CreateWallet, {
        request: req,
        host: url,
        onEnd: (code: grpcWeb.Code, msg: string | undefined) => {
          if (code === grpcWeb.Code.OK) {
            logger.info(`Wallet Created Successfully. msg is ${msg}`);
            cb(undefined, msg);
          } else {
            logger.error(`Failed to create Wallet. msg is ${msg}`);
            cb(new GRPCError(`failed to create Wallet`), undefined);
          }
        }
      });
    }
  };
}

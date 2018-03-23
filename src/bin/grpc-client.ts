import * as grpc from 'grpc';
import { PROTO_PATH } from './grpc-common';
import { Config } from '../lib/config';

export interface CreateWalletArg {
  nameSpace: string;
  passPhrase: string;
  seed?: ReadonlyArray<string>;
}

export interface RPCClient {
  createWallet: (
    arg: CreateWalletArg,
    cb: (err: any, res: any) => void
  ) => void;
}

export default function getClient(cfg: Config): RPCClient {
  const lighthouseProto: any = grpc.load(PROTO_PATH).lighthouse;
  const client: RPCClient = new lighthouseProto.WalletService(
    cfg.port,
    grpc.credentials.createInsecure()
  );
  return client;
}

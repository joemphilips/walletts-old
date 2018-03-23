import * as grpc from 'grpc';
import { PROTO_PATH } from './grpc-common';
import { Config } from '../lib/config';

export interface CreateWalletArg {
  nameSpace: string;
  passPhrase: string;
  seed?: ReadonlyArray<string>;
}

export interface RPCClient {
  ping: (arg: undefined, cb: (err: any, res: any) => void) => void;
  createWallet: (
    arg: CreateWalletArg,
    cb: (err: any, res: any) => void
  ) => void;
}

export default function getClient(url: string): RPCClient {
  const lighthouseProto: any = grpc.load(PROTO_PATH).lighthouse;
  const client: RPCClient = new lighthouseProto.WalletService(
    url,
    grpc.credentials.createInsecure()
  );
  return client;
}

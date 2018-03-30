import * as grpc from 'grpc';
import { bchInfoSource, PROTO_PATH } from './grpc-common';

export interface CreateWalletArg {
  nameSpace: string;
  passPhrase?: string;
  seed?: ReadonlyArray<string>;
}

export interface RPCClient {
  ping: (arg: undefined, cb: (err: any, res: any) => void) => void;
  createWallet: (
    arg: CreateWalletArg,
    cb: (err: any, isSuccess: { success: boolean }) => void
  ) => void;
  setupBlockchainProxy: (
    arg: {
      type: bchInfoSource;
      rpcusername: string;
      rpcpass: string;
      rpcip: string;
      rpcport: string;
    },
    cb: (err: NodeJS.ErrnoException, isSuccess: { success: boolean }) => void
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

import * as grpc from 'grpc';
import { PROTO_PATH } from './grpc-common';
import { Config } from '../lib/config';
import grpcClient from 'grpc-client'

export interface RPCClient {
  createWallet: (nameSpace: string, passPhrase: string);
}

export default function getClient(cfg: Config): RPCClient {
  const gc = new grpcClient({host: "localhost:50051", dir: '../proto'})
  return gc;
}

import * as path from 'path';

export const PROTO_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'proto',
  'walletserver.proto'
);

export enum bchInfoSource {
  trusted_rpc = 0,
  blockchain_info = 1
}

export enum grpcNetworkInfo {
  btcmain = 0,
  btctest = 1
}

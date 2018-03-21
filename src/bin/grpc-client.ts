import * as grpc from 'grpc'
import {PROTO_PATH} from './grpc-server'
import {Config} from '../lib/config'

export default function getClient(cfg: Config) {
  const lighthouse: any = grpc.load(PROTO_PATH).lighthouse
  const client = new lighthouse.WalletService(cfg.port, grpc.credentials.createInsecure())
  return client
}
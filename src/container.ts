import * as Awilix from 'awilix'
import {BasicWallet} from './wallet'
import RPCServer from './rpc_server'
import {asClass, asFunction, createContainer} from "awilix";
import {RPC} from "blockchain-proxy";
import loadConfig from './config'
import WalletDB from "./walletdb";
import {DecryptStream, EncryptStream} from "./stream";
import {BasicKeystore} from "./keystore";

const container = createContainer({
  injectionMode: "PROXY"
})

container.register({
  Wallet: asClass(BasicWallet),
  Proxy: asClass(RPC),
  KeyStore: asClass(BasicKeystore),
  RPCServer: asClass(GRPCServer),
  loadConfig: asFunction(loadConfig),
  WalletDB: asClass(WalletDB),
  WalletOutStream:  asClass(EncryptStream),
  WalletInStream: asClass(DecryptStream)
})

export default container

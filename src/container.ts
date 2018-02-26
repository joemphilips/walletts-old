// container for Injecting Dependency to default WalletService.

import {BasicWallet} from './wallet'
import RPCServer, {default as GRPCServer} from './rpc_server'
import {asClass, asFunction, createContainer, InjectionMode, Lifetime} from "awilix";
import {RPC} from "blockchain-proxy";
import WalletDB from "./walletdb";
import {DecryptStream, EncryptStream} from "./stream";
import {BasicKeystore} from "./keystore";
import BackendProxy from "./backend/node";

const container = createContainer({
  injectionMode: InjectionMode.PROXY
});

container.register({
  Wallet: asClass(BasicWallet),
  Proxy: asClass(RPC),
  KeyStore: asClass(BasicKeystore),
  RPCServer: asClass(GRPCServer),
  BackendProxy: asClass(BackendProxy),
  WalletDB: asClass(WalletDB),
  WalletOutStream:  asClass(EncryptStream),
  WalletInStream: asClass(DecryptStream)
});

export default container

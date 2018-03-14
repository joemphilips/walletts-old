// container for Injecting Dependency to default WalletService.

import { BasicWallet } from "./wallet";
import RPCServer, { default as GRPCServer } from "./rpc_server";
import {
  asClass,
  asFunction,
  asValue,
  createContainer,
  InjectionMode,
  Lifetime
} from "awilix";
import { RPC } from "blockchain-proxy";
import WalletDB from "./walletdb";
import { DecryptStream, EncryptStream } from "./stream";
import { BasicKeystore } from "./keystore";
import BackendProxy from "./backend/node";
import loadConfig from "./config";
import { CliUIProxy } from "./uiproxy";

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC
});

const defaultConfig = loadConfig({ debugFile: "../lighthouse-debug.log" });
container.register({
  cfg: asValue(defaultConfig),
  wallet: asClass(BasicWallet),
  bchproxy: asClass(RPC).inject(() => ({
    confPath: "~/.bitcoin/bitcoin.conf"
  })),
  keystore: asClass(BasicKeystore),
  server: asClass(GRPCServer),
  backend: asClass(BackendProxy),
  db: asClass(WalletDB),
  EncryptStream: asClass(EncryptStream),
  DecryptStream: asClass(DecryptStream),
  uiproxy: asClass(CliUIProxy)
});

export default container;

const mockContainer = createContainer({
  injectionMode: InjectionMode.CLASSIC
});

mockContainer.register({
  wallet: asClass(BasicWallet)
  // TODO: Register Others
  // cfg
  // wallet
  // proxy
  // kerystore
  // server
  // backend
  // db
  // EncryptStream
  // DecryptStream
  // datadir
  // conf
  // debugfile
  // port
  // netowrk
});

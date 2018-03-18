// container for Injecting Dependency to default WalletService.

import {
  asClass,
  asFunction,
  asValue,
  AwilixContainer,
  createContainer,
  InjectionMode,
  Lifetime
} from 'awilix';
import RPCServer, { default as GRPCServer } from '../bin/grpc-server';
import { CliUIProxy } from '../bin/uiproxy';
import BackendProxy from './backend/node';
import { BlockchainInfo, RPC } from './blockchain-proxy';
import loadConfig from './config';
import { BasicKeyRepository } from './key-repository';
import { InMemoryDB } from './keydb';
import { DecryptStream, EncryptStream } from './stream';
import { BasicWallet } from './wallet';
import WalletDB from './wallet-repository';

const container: AwilixContainer = createContainer({
  injectionMode: InjectionMode.CLASSIC
});

const defaultConfig = loadConfig({ debugFile: '../lighthouse-debug.log' });
container.register({
  cfg: asValue(defaultConfig),
  wallet: asClass(BasicWallet),
  bchproxy: asClass(BlockchainInfo).inject(() => ({
    confPath: '~/.bitcoin/bitcoin.conf'
  })),
  keyRepository: asClass(BasicKeyRepository),
  // TODO: Use encrypted DB (or Hareware Wallet)
  keyCryptoDB: asClass(InMemoryDB),
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

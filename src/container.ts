import * as Awilix from 'awilix'
import Wallet from './wallet'
import RPCServer from './rpc_server'
import {asClass, asFunction, createContainer} from "awilix";
import {RPC} from "blockchain-proxy";
import loadConfig from './config'

const container = createContainer({
  injectionMode: "PROXY"
})

container.register({
  Wallet: asClass(Wallet<RPC>),
  RPCServer: asClass(RPCServer),
  loadConfig: asFunction(loadConfig)
})

export default container

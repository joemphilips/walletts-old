import * as grpc from 'grpc'
import * as walletPb from '../proto/walletserver_pb'
import * as service from '../proto/walletserver_pb_service'

export const client = (endpoint: string) => {
  const serializeCreateWalletRequest = (arg: walletPb.createWalletRequest) => arg.serializeBinary()
  const deserializeCreateWalletRequest = (arg: walletPb.createWalletRequest) => arg.serializeBinary()
  const serializeCreateWalletResponse = (arg: walletPb.createWalletResponse) => arg.setSuccess(true)
  const deserializeCreateWalletResponse = (arg: walletPb.createWalletResponse) => arg.setSuccess(true)

  const WalletServiceDef = {
    createWallet: {
      path: "",
      requestStream: false,
      responseStream: false,
      requestType: walletPb.createWalletRequest,
      responseType: walletPb.createWalletResponse,
      requestSerialize: serializeCreateWalletRequest,
      requestDeserialize: deserializeCreateWalletRequest,
      responseSerialize: serializeCreateWalletResponse,
      responseDeserialize: deserializeCreateWalletResponse,
    },
    pingRequest: {

    }
  }
  const clientConst = grpc.makeGenericClientConstructor(WalletServiceDef, "walletService", {})
  const client = new clientConst(endpoint, grpc.credentials.createInsecure())
  return client
};



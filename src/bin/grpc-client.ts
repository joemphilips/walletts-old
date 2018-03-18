import * as grpc from 'grpc'

import {PROTO_PATH} from './grpc-server'

const client = grpc.load(PROTO_PATH)
export default client;

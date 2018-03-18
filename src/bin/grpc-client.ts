import * as grpc from 'grpc';

import { PROTO_PATH } from './grpc-server';

const client: any = grpc.load(PROTO_PATH).lighthouse;
export default client;

import * as grpc from 'grpc';
import { PROTO_PATH } from './grpc-server';
import logger from '../lib/logger';

logger.error(`PROTO path is ${PROTO_PATH}`)
// TODO: do not use any as a type
const client: any = grpc.load(PROTO_PATH).lighthouse;
export default client;

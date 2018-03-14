import { createLogger } from 'bunyan';
import * as Logger from 'bunyan';

const logger: Logger = createLogger({ name: 'walletts' });

export default logger;

import { createLogger, TRACE } from 'bunyan';
/* tslint:disable:no-duplicate-imports */
import * as Logger from 'bunyan';

const getLogger = (debugFile: string): Logger => {
  return createLogger({
    name: 'walletts',
    src: true,
    streams: [
      {
        name: 'stdout',
        level: 'info',
        stream: process.stdout
      },
      {
        name: 'debugStream',
        level: TRACE,
        path: debugFile
      }
    ]
  });
};

export default getLogger;

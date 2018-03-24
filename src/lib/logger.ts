import Logger, { createLogger, TRACE } from 'bunyan';

const getLogger = (debugFile: string) => {
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

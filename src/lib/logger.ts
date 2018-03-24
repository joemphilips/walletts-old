import Logger, { createLogger } from 'bunyan';

const getLogger = (debugFile: string) => {
  return createLogger({
    name: 'walletts',
    src: true,
    streams: [
      {
        level: 'info',
        stream: process.stdout
      },
      {
        level: 'trace',
        path: debugFile
      }
    ]
  });
};

export default getLogger;

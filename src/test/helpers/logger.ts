import { createLogger } from 'bunyan';
const log: any = createLogger({
  name: 'testLogger',
  straem: process.stdout,
  level: 'info'
});

export default log;

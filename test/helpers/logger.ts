import {createLogger} from 'bunyan'
const log = createLogger({
  name: "testLogger",
  straem: process.stdout,
  level: "info"
})

export default log;
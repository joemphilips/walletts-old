import {createLogger} from "bunyan";
import * as Logger from 'bunyan'

let logger: Logger = createLogger({ name: "walletts" });

export default logger;

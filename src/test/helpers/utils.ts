import { WalletOpts } from "../../lib/wallet";
import loadConfig, { WalletServiceOpts } from "../../lib/config";
import {Config} from "../../";
const path = require("path");
const fs = require("fs");

const tmpDir = path.join(__dirname, "..", "tmp");
const testConfFilePath = path.join(__dirname, "..", "fixtures", "test.conf");

export function loadWalletConf(testSuiteName: string): Config {
  let datadir = path.join(tmpDir, testSuiteName);
  // create datadir if it does not exist.
  if (!fs.existsSync(datadir)) {
    fs.mkdirSync(datadir);
  }
  const debugLog = path.join(datadir, "debug.log");
  let opts: WalletServiceOpts = {
    datadir: datadir,
    debugFile: debugLog,
    port: 0 // random port
  };

  return loadConfig(opts);
}

import fs from 'fs';
import { log, getExecutable, isReady } from './utils.js';
import {install} from "./installer.js";
import {runDependencyCheck} from "./executor.js";
import {forceInstall, getBinDir, getOdcVersion, getOutDir} from "./cli.js";

export async function run() {
  const envOwaspBin = process.env.OWASP_BIN;

  if (envOwaspBin && fs.existsSync(envOwaspBin)) {
    log('Locally preinstalled (OWASP_BIN) Dependency-Check Core found.');
    await runDependencyCheck(envOwaspBin, getOutDir());
    return;
  }

  const binDir = getBinDir();

  if (forceInstall() || !isReady()) {
    log('No Dependency-Check Core executable found. Downloading into:', binDir);
    await install(binDir, getOdcVersion());
    log('Download done.');
  }

  await runDependencyCheck(getExecutable(), getOutDir());
}

import fs from 'fs';
import {program} from 'commander';
import { getBinDir,  log, getExecutable, isReady } from './utils.js';
import {install} from "./installer.js";
import {runDependencyCheck} from "./executor.js";

export async function run() {
  const envOwaspBin = process.env.OWASP_BIN;

  if (envOwaspBin && fs.existsSync(envOwaspBin)) {
    log('Locally preinstalled (OWASP_BIN) Dependency-Check Core found.');
    runDependencyCheck(envOwaspBin);
    return;
  }

  const binDir = getBinDir();

  if (program.opts().forceInstall || !isReady(binDir)) {
    log('No Dependency-Check Core executable found. Downloading into:', binDir);
    await install(binDir, program.opts().odcVersion);
    log('Download done.');
  }

  runDependencyCheck(getExecutable(), program.opts().out);
}

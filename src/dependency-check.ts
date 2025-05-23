#!/usr/bin/env node
import fs from "fs";
import { log } from "./utils.js";
import { installDependencyCheck } from "./installer.js";
import { runDependencyCheck } from "./executor.js";
import {
  forceInstall,
  getBinDir,
  getGitHubToken,
  getOdcVersion,
  getOutDir,
  getOwaspBinary,
  getProxyUrl,
} from "./cli.js";
import path from "path";
import os from "os";

const IS_WIN = os.platform() === "win32";

function getExecutable() {
  const binDir = getBinDir();

  return path.resolve(
    binDir,
    "dependency-check",
    "bin",
    `dependency-check.${IS_WIN ? "bat" : "sh"}`,
  );
}

function isReady() {
  return fs.existsSync(getExecutable());
}

export async function run() {
  getOwaspBinary().ifJust(async (owaspBinary) => {
    log("Locally preinstalled (OWASP_BIN) Dependency-Check Core found.");
    await runDependencyCheck(owaspBinary, getOutDir(), getProxyUrl());
    return;
  });

  const binDir = getBinDir();

  if (forceInstall() || !isReady()) {
    log("No Dependency-Check Core executable found. Downloading into:", binDir);
    await installDependencyCheck(
      binDir,
      getOdcVersion(),
      getProxyUrl(),
      getGitHubToken(),
    );
    log("Download done.");
  }

  await runDependencyCheck(getExecutable(), getOutDir(), getProxyUrl());
}

void run();

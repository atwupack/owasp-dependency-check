#!/usr/bin/env node
import { ensureError, findOwaspExecutable, log } from "./utils.js";
import { installDependencyCheck } from "./installer.js";
import { executeDependencyCheck } from "./executor.js";
import {
  exitProcess,
  forceInstall,
  getBinDir,
  getCmdArguments,
  getGitHubToken,
  getOdcVersion,
  getOutDir,
  getOwaspBinary,
  getProxyUrl,
} from "./cli.js";
import { Maybe } from "purify-ts";

export async function run() {
  let executable = getOwaspBinary();
  if (executable.isNothing()) {
    const binDir = getBinDir();
    executable = findOwaspExecutable(binDir);

    if (forceInstall() || executable.isNothing()) {
      log(
        "No Dependency-Check Core executable found. Downloading into:",
        binDir,
      );
      executable = Maybe.of(
        await installDependencyCheck(
          binDir,
          getOdcVersion(),
          getProxyUrl(),
          getGitHubToken(),
        ),
      );
      log("Download done.");
    }
  } else {
    log("Locally preinstalled (OWASP_BIN) Dependency-Check Core found.");
  }

  executable.ifJust(async (executable) => {
    const result = await executeDependencyCheck(
      executable,
      getCmdArguments(),
      getOutDir(),
      getProxyUrl(),
    );
    result.ifJust((status) => {
      exitProcess(status);
    });
  });
}

void run().catch((e: unknown) => {
  const error = ensureError(e);
  console.error("An error occurred:", error.message);
  exitProcess(1);
});

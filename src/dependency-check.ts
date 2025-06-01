#!/usr/bin/env node
import { ensureError, log } from "./utils.js";
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
    executable = Maybe.of(
      await installDependencyCheck(
        getBinDir(),
        getOdcVersion(),
        getProxyUrl(),
        getGitHubToken(),
        forceInstall(),
      ),
    );
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

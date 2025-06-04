#!/usr/bin/env node
import { ensureError, exitProcess, log, logError } from "./utils.js";
import { installDependencyCheck } from "./installer.js";
import { executeDependencyCheck } from "./executor.js";
import cli from "./cli.js";
import { Maybe } from "purify-ts";

export async function run() {
  let executable = cli.owaspBinary;
  if (executable.isNothing()) {
    executable = Maybe.of(
      await installDependencyCheck(
        cli.binDir,
        cli.odcVersion,
        cli.proxyUrl,
        cli.githubToken,
        cli.forceInstall,
      ),
    );
  } else {
    log("Locally preinstalled (OWASP_BIN) Dependency-Check Core found.");
  }

  executable.ifJust(async (executable) => {
    const result = await executeDependencyCheck(
      executable,
      cli.cmdArguments,
      cli.outDir,
      cli.proxyUrl,
      cli.hideOwaspOutput,
    );
    result.ifJust((status) => {
      exitProcess(status, cli.ignoreErrors);
    });
  });
}

void run().catch((e: unknown) => {
  const error = ensureError(e);
  logError("An error occurred:", error.message);
  exitProcess(1, cli.ignoreErrors);
});

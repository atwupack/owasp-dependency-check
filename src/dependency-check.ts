#!/usr/bin/env node
import { ensureError, setExitCode } from "./utils.js";
import { installDependencyCheck } from "./installer.js";
import { executeDependencyCheck } from "./executor.js";
import { parseCli } from "./cli.js";
import { Maybe } from "purify-ts";
import { createLogger } from "./log.js";
import { name } from "./info.js";

const log = createLogger(name);

let ignoreErrors = false;

export async function run() {
  const cli = parseCli();
  ignoreErrors = cli.ignoreErrors;

  let executable = cli.owaspBinary;
  if (executable.isNothing()) {
    executable = Maybe.of(
      await installDependencyCheck(
        cli.binDir,
        cli.odcVersion,
        cli.proxyUrl,
        cli.githubToken,
        cli.forceInstall,
        cli.keepOldVersions,
      ),
    );
  } else {
    log.info("Locally preinstalled (OWASP_BIN) Dependency-Check Core found.");
  }

  if (executable.isJust()) {
    const result = await executeDependencyCheck(
      executable.unsafeCoerce(),
      cli.cmdArguments,
      cli.outDir,
      cli.proxyUrl,
      cli.hideOwaspOutput,
      cli.javaBinary,
    );
    setExitCode(result, ignoreErrors, log);
  }
}

void run().catch((e: unknown) => {
  const error = ensureError(e);
  log.error(error.message);
  setExitCode(1, ignoreErrors, log);
});

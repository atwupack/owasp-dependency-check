import { cleanDir, hideSecrets, setEnv } from "./utils.js";
import {
  SpawnSyncOptions,
  SpawnSyncOptionsWithStringEncoding,
} from "child_process";
import spawn from "cross-spawn";
import { Maybe } from "purify-ts";
import { green } from "ansis";
import { createLogger } from "./log.js";
import { name } from "./info.js";

const log = createLogger(`${name} Analysis`);

function logCommandExecution(executable: string, cmdArguments: string[]) {
  const command = `${executable} ${hideSecrets(cmdArguments.join(" "))}`;
  log.info("Running command:", command);
}

function executeVersionCheck(executable: string) {
  const versionCmdArguments = ["--version"];
  logCommandExecution(executable, versionCmdArguments);

  const versionSpawnOpts: SpawnSyncOptionsWithStringEncoding = {
    shell: false,
    encoding: "utf-8",
  };

  const versionSpawn = spawn.sync(
    executable,
    versionCmdArguments,
    versionSpawnOpts,
  );
  if (versionSpawn.error) {
    throw versionSpawn.error;
  }
  if (versionSpawn.status === null) {
    throw new Error("Version check did not complete with status code.");
  }
  if (versionSpawn.status !== 0) {
    throw new Error(versionSpawn.stderr);
  }
  log.info(versionSpawn.stdout.trimEnd());
}

function executeAnalysis(
  executable: string,
  cmdArguments: string[],
  proxyUrl: Maybe<URL>,
  hideOwaspOutput: boolean,
) {
  setEnv("JAVA_OPTS", proxyUrl.map(buildJavaToolOptions), true, log);

  const dependencyCheckSpawnOpts: SpawnSyncOptions = {
    shell: false,
    stdio: hideOwaspOutput ? "ignore" : "inherit",
  };

  logCommandExecution(executable, cmdArguments);
  const dependencyCheckSpawn = spawn.sync(
    executable,
    cmdArguments,
    dependencyCheckSpawnOpts,
  );
  if (dependencyCheckSpawn.error) {
    throw dependencyCheckSpawn.error;
  }
  if (dependencyCheckSpawn.status === null) {
    throw new Error("Analysis did not complete with status code.");
  }

  log.info(green`Done.`);
  return dependencyCheckSpawn.status;
}

export function executeDependencyCheck(
  executable: string,
  cmdArguments: string[],
  outDir: string,
  proxyUrl: Maybe<URL>,
  hideOwaspOutput: boolean,
  javaBinary: Maybe<string>,
) {
  log.info("Dependency-Check Core path:", executable);
  cleanDir(outDir, log);

  setEnv("JAVACMD", javaBinary, false, log);

  executeVersionCheck(executable);
  return executeAnalysis(executable, cmdArguments, proxyUrl, hideOwaspOutput);
}

export function buildJavaToolOptions(proxyUrl: URL) {
  let javaToolOptions = `-Dhttps.proxyHost=${proxyUrl.hostname}`;
  if (proxyUrl.port) {
    javaToolOptions += ` -Dhttps.proxyPort=${proxyUrl.port}`;
  }
  if (proxyUrl.username) {
    javaToolOptions += ` -Dhttps.proxyUser=${proxyUrl.username}`;
  }
  if (proxyUrl.password) {
    javaToolOptions += ` -Dhttps.proxyPassword=${proxyUrl.password}`;
  }
  return javaToolOptions;
}

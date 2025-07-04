import { cleanDir, hideSecrets } from "./utils.js";
import path from "path";
import {
  SpawnOptions,
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

  const versionSpawnOpts: SpawnSyncOptionsWithStringEncoding = {
    cwd: path.resolve(process.cwd()),
    shell: false,
    encoding: "utf-8",
  };

  logCommandExecution(executable, versionCmdArguments);
  const versionSpawn = spawn.sync(
    executable,
    versionCmdArguments,
    versionSpawnOpts,
  );
  if (versionSpawn.error) {
    throw versionSpawn.error;
  }
  if (versionSpawn.status && versionSpawn.status !== 0) {
    throw new Error(versionSpawn.stderr.toString());
  }

  const versionSpawnResult = versionSpawn.stdout;

  const re = /\D* (\d+\.\d+\.\d+).*/;
  const versionMatch = re.exec(versionSpawnResult);
  log.info(
    "Dependency-Check Core version:",
    versionMatch ? versionMatch[1] : versionSpawnResult,
  );
}

function executeAnalysis(
  executable: string,
  cmdArguments: string[],
  proxyUrl: Maybe<URL>,
  hideOwaspOutput: boolean,
) {
  const env = process.env;
  proxyUrl.ifJust((proxyUrl) => {
    env.JAVA_OPTS = buildJavaToolOptions(proxyUrl);
  });

  const dependencyCheckSpawnOpts: SpawnOptions = {
    cwd: path.resolve(process.cwd()),
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

  log.info(green`Done.`);
  return Maybe.fromNullable(dependencyCheckSpawn.status);
}

export async function executeDependencyCheck(
  executable: string,
  cmdArguments: string[],
  outDir: string,
  proxyUrl: Maybe<URL>,
  hideOwaspOutput: boolean,
) {
  log.info("Dependency-Check Core path:", executable);
  await cleanDir(path.resolve(process.cwd(), outDir), log);

  executeVersionCheck(executable);
  return executeAnalysis(executable, cmdArguments, proxyUrl, hideOwaspOutput);
}

function buildJavaToolOptions(proxyUrl: URL) {
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

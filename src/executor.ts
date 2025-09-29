import { hideSecrets } from "./util/misc.js";
import { Maybe, Nothing } from "purify-ts";
import { green } from "ansis";
import { createLogger } from "./util/log.js";
import { name } from "./info.js";
import { cleanDir } from "./util/fs.js";
import { setEnv, spawnSync } from "./util/proc.js";

const log = createLogger(`${name} Analysis`);

function logCommandExecution(executable: string, cmdArguments: string[]) {
  const command = `${executable} ${hideSecrets(cmdArguments.join(" "))}`;
  log.info("Running command:", command);
}

function executeVersionCheck(executable: string) {
  const versionCmdArguments = ["--version"];
  logCommandExecution(executable, versionCmdArguments);
  return spawnSync(executable, versionCmdArguments, Nothing).map(result =>
    result.stdout.trimEnd(),
  );
}

function executeAnalysis(
  executable: string,
  cmdArguments: string[],
  proxyUrl: Maybe<URL>,
  hideOwaspOutput: boolean,
) {
  setEnv("JAVA_OPTS", proxyUrl.map(buildJavaToolOptions), true, log);
  logCommandExecution(executable, cmdArguments);
  return spawnSync(
    executable,
    cmdArguments,
    Maybe.of(hideOwaspOutput ? "ignore" : "inherit"),
  ).map(result => {
    log.info(green`Done.`);
    return result.status;
  });
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

  return executeVersionCheck(executable).chain(version => {
    log.info(version);
    return executeAnalysis(executable, cmdArguments, proxyUrl, hideOwaspOutput);
  });
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

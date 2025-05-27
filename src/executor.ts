import { cleanDir, hideSecrets, log } from "./utils.js";
import path from "path";
import {
  SpawnOptions,
  SpawnSyncOptionsWithBufferEncoding,
  SpawnSyncOptionsWithStringEncoding,
} from "child_process";
import spawn from "cross-spawn";
import colors from "@colors/colors/safe.js";
import { getCmdArguments } from "./cli.js";
import { Maybe } from "purify-ts";

function executeVersionCheck(executable: string) {
  const versionCmdArguments = ["--version"];
  const versionCmd = `${executable} --version`;

  const versionSpawnOpts:
    | SpawnOptions
    | SpawnSyncOptionsWithBufferEncoding
    | SpawnSyncOptionsWithStringEncoding = {
    cwd: path.resolve(process.cwd()),
    shell: false,
    encoding: "utf-8",
  };

  log("Running command:\n", versionCmd);
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
  log(
    "Dependency-Check Core version:",
    versionMatch ? versionMatch[1] : versionSpawnResult,
  );
}

function executeAnalysis(executable: string, proxyUrl: Maybe<URL>) {
  const env = process.env;
  proxyUrl.ifJust((proxyUrl) => {
    env.JAVA_OPTS = buildJavaToolOptions(proxyUrl);
  });

  const dependencyCheckSpawnOpts: SpawnOptions = {
    cwd: path.resolve(process.cwd()),
    shell: false,
    stdio: "inherit",
  };

  const dependencyCheckCmdArguments = getCmdArguments();
  const dependencyCheckCmd = `${executable} ${hideSecrets(dependencyCheckCmdArguments.join(" "))}`;

  log("Running command:\n", dependencyCheckCmd);
  const dependencyCheckSpawn = spawn.sync(
    executable,
    dependencyCheckCmdArguments,
    dependencyCheckSpawnOpts,
  );

  if (dependencyCheckSpawn.error) {
    throw dependencyCheckSpawn.error;
  }

  log(colors.green("Done."));
  return Maybe.fromNullable(dependencyCheckSpawn.status);
}

export async function executeDependencyCheck(
  executable: string,
  outDir: string,
  proxyUrl: Maybe<URL>,
) {
  log("Dependency-Check Core path:", executable);
  await cleanDir(path.resolve(process.cwd(), outDir));

  executeVersionCheck(executable);
  return executeAnalysis(executable, proxyUrl);
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

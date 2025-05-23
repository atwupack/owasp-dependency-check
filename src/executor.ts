import { cleanDir, ensureError, hideSecrets, log } from "./utils.js";
import path from "path";
import {
  SpawnOptions,
  SpawnSyncOptionsWithBufferEncoding,
  SpawnSyncOptionsWithStringEncoding,
} from "child_process";
import spawn from "cross-spawn";
import colors from "@colors/colors/safe.js";
import { exitProcess, getCmdArguments, getProxyUrl } from "./cli.js";
import { Maybe } from "purify-ts";

function runVersionCheck(executable: string) {
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

function runAnalysis(executable: string) {
  const env = process.env;
  getJavaToolOptions().ifJust((options) => {
    env.JAVA_OPTS = options;
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

export async function runDependencyCheck(executable: string, outDir: string) {
  try {
    log("Dependency-Check Core path:", executable);
    await cleanDir(path.resolve(process.cwd(), outDir));

    runVersionCheck(executable);
    runAnalysis(executable).ifJust(exitProcess);
  } catch (e) {
    const error = ensureError(e);
    log(error.message);
    exitProcess(1);
  }
}

function getJavaToolOptions() {
  return getProxyUrl().map((proxyUrl) => {
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
  });
}

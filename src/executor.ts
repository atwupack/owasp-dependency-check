import {
  cleanDir,
  ensureError,
  exitProcess,
  getJavaToolOptions,
  hideSecrets,
  ifPresent,
  log,
} from "./utils.js";
import path from "path";
import {
  SpawnOptions,
  SpawnSyncOptionsWithBufferEncoding,
  SpawnSyncOptionsWithStringEncoding,
} from "child_process";
import spawn from "cross-spawn";
import colors from "@colors/colors/safe.js";
import { getCmdArguments } from "./cli.js";

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
  ifPresent(getJavaToolOptions(), (options) => {
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
  return dependencyCheckSpawn.status;
}

export async function runDependencyCheck(executable: string, outDir: string) {
  try {
    log("Dependency-Check Core path:", executable);
    await cleanDir(path.resolve(process.cwd(), outDir));

    runVersionCheck(executable);
    const resultCode = runAnalysis(executable);
    exitProcess(resultCode);
  } catch (e) {
    const error = ensureError(e);
    log(error.message);
    exitProcess(1);
  }
}

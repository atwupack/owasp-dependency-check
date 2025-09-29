import { Logger } from "./log.js";
import { Either, Left, Maybe, Right } from "purify-ts";
import { hideSecrets } from "./misc.js";
import spawn from "cross-spawn";
import { StdioOptions } from "node:child_process";
import { SpawnSyncOptionsWithStringEncoding } from "child_process";

export function setExitCode(code: number, ignoreErrors: boolean, log: Logger) {
  let finalCode = 0;
  if (ignoreErrors) {
    if (code != 0) {
      log.warn(`Ignoring error code ${code.toString()}`);
    }
  } else {
    finalCode = code;
  }
  log.info(`Exit with code ${finalCode.toString()}`);
  process.exitCode = finalCode;
}

export function setEnv(
  key: string,
  value: Maybe<string>,
  append: boolean,
  log: Logger,
) {
  value.ifJust(value => {
    if (append && process.env[key]) {
      value = `${process.env[key]} ${value}`;
    }
    log.info(`Setting environment variable ${key} to "${hideSecrets(value)}"`);
    process.env[key] = value;
  });
}

export function spawnSync(
  command: string,
  args: string[],
  stdio: Maybe<StdioOptions>,
) {
  const spawnOpts: SpawnSyncOptionsWithStringEncoding = {
    shell: false,
    encoding: "utf-8",
    stdio: stdio.extract(),
  };
  return Either.encase(() => spawn.sync(command, args, spawnOpts)).chain(
    spawn => {
      if (spawn.error) {
        return Left(spawn.error);
      }
      if (spawn.status === null) {
        return Left(new Error("Spawn did not complete with status code."));
      }
      return Right({ status: spawn.status, stdout: spawn.stdout });
    },
  );
}

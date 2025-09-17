import { Logger } from "./log.js";
import { Maybe } from "purify-ts";
import { hideSecrets } from "./misc.js";

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

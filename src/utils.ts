import { Logger } from "./util/log.js";
import { Maybe } from "purify-ts";

export function ensureError(error: unknown): Error {
  if (error instanceof Error) return error;

  let stringified: string;
  try {
    stringified = JSON.stringify(error);
  } catch {
    stringified = "[Unable to stringify the thrown value]";
  }

  return new Error(
    `This value was thrown as is, not through an Error: ${stringified}`,
  );
}

const SECRET_REGEX = /(-\S*(?:key|token|pass)[^\s=]*(?:=| +))(\S*)/gi;

export function hideSecrets(input: string) {
  return input.replace(SECRET_REGEX, "$1<secret value>");
}

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

export function orThrow<T>(value: Maybe<T>, error: string): T {
  return value.toEither(new Error(error)).unsafeCoerce();
}

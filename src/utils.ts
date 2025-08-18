import extract from "extract-zip";
import { Logger } from "./log.js";
import { Maybe, MaybeAsync } from "purify-ts";
import fs from "node:fs";
import path from "node:path";
import { fetch, RequestInfo, RequestInit } from "undici";

export async function cleanDir(dir: string, log: Logger) {
  log.info(`Cleaning directory ${dir}`);
  await deleteQuietly(dir, true, log);
  await fs.promises.mkdir(dir, { recursive: true });
}

async function deleteQuietly(path: string, recursive: boolean, log: Logger) {
  try {
    await fs.promises.rm(path, { force: true, recursive: recursive });
    log.info(`Deleted "${path}"`);
  } catch (e) {
    const error = ensureError(e);
    log.warn(`Could not delete "${path}". Reason: ${error}`);
  }
}

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

export async function unzipFileIntoDirectory(
  zipFile: string,
  destDir: string,
  deleteZip: boolean,
  log: Logger,
) {
  await extract(zipFile, { dir: destDir });
  if (deleteZip) {
    await deleteQuietly(zipFile, false, log);
  }
}

export function setEnv(key: string, value: Maybe<string>, log: Logger) {
  value.ifJust(value => {
    log.info(`Setting environment variable ${key} to "${hideSecrets(value)}"`);
    process.env[key] = value;
  });
}

export function resolveFile(...paths: string[]) {
  const file = path.resolve(...paths);
  return Maybe.encase(() => fs.statSync(file))
    .filter(stat => stat.isFile())
    .map(() => path.resolve(file));
}

export function fetchUrl(url: RequestInfo, init: RequestInit) {
  return MaybeAsync(() => fetch(url, init)).filter(response => response.ok);
}

export function orThrow<T>(value: Maybe<T>, error: string): T {
  return value.toEither(new Error(error)).unsafeCoerce();
}

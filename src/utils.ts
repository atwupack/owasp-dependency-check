import extract from "extract-zip";
import fs from "node:fs/promises";
import { Logger } from "./log.js";
import { Maybe } from "purify-ts";

export async function cleanDir(dir: string, log: Logger) {
  log.info(`Cleaning directory ${dir}`);
  await deleteQuietly(dir, true, log);
  await fs.mkdir(dir, { recursive: true });
}

async function deleteQuietly(path: string, recursive: boolean, log: Logger) {
  try {
    await fs.rm(path, { force: true, recursive: recursive });
    log.info(`Deleted "${path}"`);
  } catch (e) {
    const error = ensureError(e);
    log.warn(`Could not delete "${path}". Reason: ${error}`);
  }
}

export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value;

  let stringified: string;
  try {
    stringified = JSON.stringify(value);
  } catch {
    stringified = "[Unable to stringify the thrown value]";
  }

  return new Error(
    `This value was thrown as is, not through an Error: ${stringified}`,
  );
}

const SECRET_REGEX = /(--\S*(?:key|token|pass)[^\s=]*(?:=| +))(\S*)/gi;

export function hideSecrets(input: string) {
  return input.replace(SECRET_REGEX, "$1<secret value>");
}

export function exitProcess(
  code: Maybe<number>,
  ignoreErrors: boolean,
  log: Logger,
) {
  let finalCode: number | undefined = 0;
  if (ignoreErrors) {
    code.ifJust((value) => {
      if (value != 0) {
        log.warn(`Ignoring error code ${value.toString()}`);
      }
    });
  } else {
    finalCode = code.extract();
  }
  if (finalCode) {
    log.info(`Exit with code ${finalCode.toString()}`);
  }
  process.exitCode = finalCode;
}

export async function unzipFileIntoDirectory(
  zipFile: string,
  destDir: string,
  deleteZip: boolean,
  log: Logger,
) {
  await extract(zipFile, {
    dir: destDir,
  });
  if (deleteZip) {
    await deleteQuietly(zipFile, false, log);
  }
}

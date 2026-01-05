import { Logger } from "./log.js";
import fs from "node:fs";
import extract from "extract-zip";
import path from "node:path";
import { EitherAsync, Maybe } from "purify-ts";
import { ensureError } from "./misc.js";

export function cleanDir(dir: string, log: Logger) {
  log.info(`Cleaning directory ${dir}`);
  deleteQuietly(dir, true, log);
  fs.mkdirSync(dir, { recursive: true });
}

export function deleteQuietly(path: string, recursive: boolean, log: Logger) {
  try {
    fs.rmSync(path, { force: true, recursive: recursive });
    log.info(`Deleted "${path}"`);
  } catch (e) {
    const error = ensureError(e);
    log.warn(`Could not delete "${path}". Reason: ${error}`);
  }
}

export function unzipFileIntoDirectory(
  zipFile: string,
  destDir: string,
  deleteZip: boolean,
  log: Logger,
) {
  return EitherAsync(() => extract(zipFile, { dir: destDir }))
    .map(() => {
      if (deleteZip) {
        deleteQuietly(zipFile, false, log);
      }
    })
    .mapLeft(ensureError);
}

export function resolveFile(...paths: string[]) {
  const file = path.resolve(...paths);
  return Maybe.encase(() => fs.statSync(file))
    .filter(stat => stat.isFile())
    .map(() => path.resolve(file));
}

import { Logger } from "./log.js";
import fs from "node:fs";
import { ensureError } from "../utils.js";
import extract from "extract-zip";
import path from "node:path";
import { Maybe } from "purify-ts";

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

export async function unzipFileIntoDirectory(
  zipFile: string,
  destDir: string,
  deleteZip: boolean,
  log: Logger,
) {
  await extract(zipFile, { dir: destDir });
  if (deleteZip) {
    deleteQuietly(zipFile, false, log);
  }
}

export function resolveFile(...paths: string[]) {
  const file = path.resolve(...paths);
  return Maybe.encase(() => fs.statSync(file))
    .filter(stat => stat.isFile())
    .map(() => path.resolve(file));
}

import fs from "fs/promises";
import colors from "@colors/colors/safe.js";
import extract from "extract-zip";
import fsp from "node:fs/promises";

export async function cleanDir(dir: string) {
  log(`Cleaning directory ${dir}`);
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    const error = ensureError(e);
    logError(`Could not delete directory ${dir}. Error: ${error}`);
    return;
  }
  await fs.mkdir(dir, { recursive: true });
}

export function log(...logData: string[]) {
  console.log(
    [
      colors.bgGreen(colors.white(" owasp-dependency-check: ")),
      ...logData,
    ].join(" "),
  );
}

export function logError(...logData: string[]) {
  console.error([colors.bgRed(colors.white(" ERROR: ")), ...logData].join(" "));
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

export function exitProcess(code: number | null, ignoreErrors: boolean) {
  if (ignoreErrors) {
    process.exit(0);
  } else {
    process.exit(code);
  }
}

export async function unzipFileIntoDirectory(
  zipFile: string,
  destDir: string,
  deleteZip: boolean,
) {
  await extract(zipFile, {
    dir: destDir,
  });
  if (deleteZip) {
    await fsp.rm(zipFile);
  }
}

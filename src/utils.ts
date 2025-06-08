import { rimraf } from "rimraf";
import fs from "fs/promises";
import colors from "@colors/colors/safe.js";

export async function cleanDir(dir: string) {
  const cleanResult = await rimraf.rimraf(dir);

  if (!cleanResult) {
    logError("Could not delete directory '%s'.", dir);
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
  console.log([colors.bgRed(colors.white(" ERROR: ")), ...logData].join(" "));
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

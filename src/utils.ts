import { rimraf } from "rimraf";
import { mkdir } from "fs/promises";
import colors from "@colors/colors/safe.js";

export async function cleanDir(dir: string) {
  const cleanResult = await rimraf.rimraf(dir);

  if (!cleanResult) {
    console.error("Could not delete directory '%s'.", dir);
    return;
  }

  await mkdir(dir, { recursive: true });
}

export function log(...logData: string[]) {
  console.log(
    [
      colors.bgGreen(colors.white(" owasp-dependency-check: ")),
      ...logData,
    ].join(" "),
  );
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

export function orElseGet<T>(value: T | undefined, callback: () => T) {
  return value ?? callback();
}

const SECRET_REGEX = /(--\S*(?:key|token|pass)\S*(?:=| +))(\S*)/gi;

export function hideSecrets(input: string) {
  return input.replace(SECRET_REGEX, "$1<secret value>");
}

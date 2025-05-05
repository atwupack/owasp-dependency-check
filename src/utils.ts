import {rimraf} from "rimraf";
import os from "os";
import path from "path";
import fs from "fs";
import { mkdir } from 'fs/promises';
import colors from '@colors/colors/safe.js';
import {getBinDir, getProxyUrl} from "./cli.js";

const IS_WIN = os.platform() === 'win32';

export function getJavaToolOptions() {
  const proxyUrl = getProxyUrl();
  if (!proxyUrl) {
    return undefined;
  }
  const url = new URL(proxyUrl);
  let javaToolOptions = `-Dhttps.proxyHost=${url.hostname}`;
  if (url.port) {
    javaToolOptions += ` -Dhttps.proxyPort=${url.port}`;
  }
  if (url.username) {
    javaToolOptions += ` -Dhttps.proxyUser=${url.username}`;
  }
  if (url.password) {
    javaToolOptions += ` -Dhttps.proxyPassword=${url.password}`;
  }
  return javaToolOptions;
}


export function getExecutable() {
  const binDir = getBinDir();

  return path.resolve(binDir, 'dependency-check', 'bin', `dependency-check.${IS_WIN ? 'bat' : 'sh'}`);
}

export async function cleanDir(dir: string) {
  const cleanResult = await rimraf.rimraf(dir);

  if (!cleanResult) {
    console.error("Could not delete directory '%s'.", dir);
    return;
  }

  await mkdir(dir, { recursive: true });
}

export function isReady() {
  return fs.existsSync(getExecutable());
}

export function log(...logData: string[]) {
  console.log([
      colors.bgGreen(colors.white(' owasp-dependency-check: ')),
    ...logData,
  ].join(' '));
}

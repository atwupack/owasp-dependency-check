import {rimraf} from "rimraf";
import os from "os";
import path from "path";
import fs from "fs";
import { program } from "commander";
import { mkdir } from 'fs/promises';
import colors from 'colors';

const IS_WIN = os.platform() === 'win32';

export function getBinDir() {
  return path.resolve(process.cwd(), program.opts().bin, program.opts().odcVersion);
}

export function getCmdArguments() {
  const args = [
    `--out=${program.opts().out}`,
    ...program.args
  ];

  if (!hasCmdArg(args, '--project')) {
    args.push(`--project="${getProjectName()}"`);
  }

  if (!hasCmdArg(args, '-d') && !hasCmdArg(args, '--data')) {
    args.push('--data=/tmp/dependency-check-data');
  }

  if (!hasCmdArg(args, '-f') && !hasCmdArg(args, '--format')) {
    args.push('--format=HTML');
    args.push('--format=JSON');
  }

  if (!hasCmdArg(args, '-s') && !hasCmdArg(args, '--scan')) {
    args.push('--scan=package-lock.json');
  }

  return args.join(' ');
}

export function getExecutable() {
  const binDir = getBinDir();

  return path.resolve(binDir, 'dependency-check', 'bin', `dependency-check.${IS_WIN ? 'bat' : 'sh'}`);
}

export async function cleanDir(dir) {
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

function getProjectName() {
  let projectName = process.env.PROJECT_NAME;

  if (!projectName) {
    try {
      const packageJson = require(path.resolve(process.cwd(), 'package.json'));
      projectName = packageJson.name;
    }
    catch (e) {
      console.error(e);
    }
  }

  return projectName;
}

function hasCmdArg(args, argPrefix) {
  return args.find(arg => arg.startsWith(`${argPrefix}=`) || arg.startsWith(`${argPrefix} `) || arg === argPrefix);
}

export function log(...logData) {
  if (!logData) {
    return;
  }

  console.log([
    'owasp-dependency-check:'.bgGreen.black,
    ...logData,
  ].join(' '));
}

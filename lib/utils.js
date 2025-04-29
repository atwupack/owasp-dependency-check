const rimraf = require('rimraf');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { program } = require('commander');
const { mkdir } = require('fs/promises');
const fetch = require('node-fetch');
const Downloader = require('nodejs-file-downloader');
const extract = require('extract-zip');
const colors = require('colors');
const IS_WIN = os.platform() === 'win32';
const NAME_RE = /^dependency-check-\d+\.\d+\.\d+-release\.zip$/;
const LATEST_RELEASE_URL = 'https://api.github.com/repos/dependency-check/DependencyCheck/releases/latest';
const TAG_RELEASE_URL = 'https://api.github.com/repos/dependency-check/DependencyCheck/releases/tags/';

const LOG_FILE_NAME = 'dependency-check.log';

function getBinDir() {
  return path.resolve(process.cwd(), program.opts().bin, program.opts().odcVersion);
}

function getCmdArguments() {
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

function getExecutable() {
  const binDir = getBinDir();

  return path.resolve(binDir, 'dependency-check', 'bin', `dependency-check.${IS_WIN ? 'bat' : 'sh'}`);
}

async function cleanDir(dir) {
  const cleanResult = await rimraf.rimraf(dir);

  if (!cleanResult) {
    console.error("Could not delete directory '%s'.", dir);
    return;
  }

  await mkdir(dir, { recursive: true });
}

function isReady() {
  return fs.existsSync(getExecutable());
}

async function install() {
  const binDir = getBinDir();

  await cleanDir(binDir);

  // if the odc version is the latest use the latest URL, otherwise use version URL
  const url = program.opts().odcVersion === 'latest' ? LATEST_RELEASE_URL : TAG_RELEASE_URL + program.opts().odcVersion;
  const res = await fetch(url);
  let body;

  try {
    body = await res.text();
    const json = JSON.parse(body);
    const asset = json.assets.find(a => NAME_RE.test(a.name));

    const downloader = new Downloader({
      url: asset.browser_download_url,
      directory: binDir,
      fileName: asset.name,
    });
    await downloader.download();

    await extract(path.resolve(binDir, asset.name), {
      dir: binDir,
    });
  }
  catch (e) {
    console.error(`Failed to download and install. See ${LOG_FILE_NAME} for more details.`);
    if (body) {
      fs.writeFileSync(LOG_FILE_NAME, `${e}\n\nResponse was:\n${body}`);
    }
    else {
      fs.writeFileSync(LOG_FILE_NAME, `${e}`);
    }
    process.exit(1);
  }
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

function log(...logData) {
  if (!logData) {
    return;
  }

  console.log([
    'owasp-dependency-check:'.bgGreen.black,
    ...logData,
  ].join(' '));
}

module.exports = {
  getBinDir,
  getCmdArguments,
  getExecutable,
  cleanDir,
  isReady,
  install,
  log,
};

import {
  program,
  Option,
  InvalidArgumentError,
} from "@commander-js/extra-typings";
import path from "path";
import os from "os";
import fs, { readFileSync } from "fs";
import { Maybe } from "purify-ts";
import { ensureError, logError } from "./utils.js";

const cli = program
  .allowExcessArguments()
  .allowUnknownOption()
  .option(
    "-o, --out <path>",
    "the folder to write reports to",
    "dependency-check-reports",
  )
  .option(
    "--bin <path>",
    "directory to which the dependency-check CLI will be installed",
    "dependency-check-bin",
  )
  .option(
    "--force-install",
    "install the dependency-check CLI even if there already is one (will be overwritten)",
    false,
  )
  .option(
    "--odc-version <version>",
    'the version of the dependency-check CLI to install in format "v1.2.3"',
  )
  .option(
    "-p, --proxy <url>",
    "the URL to a proxy server in the format http(s)://[user]:[password]@<server>:[port]",
    parseProxyUrl,
  )
  .addOption(
    new Option(
      "--github-token <token>",
      "GitHub token to authenticate against API",
    ).env("GITHUB_TOKEN"),
  )
  .addOption(
    new Option(
      "--nvdApiKey <key>",
      "NVD API key to authenticate against API",
    ).env("NVD_API_KEY"),
  )
  .addOption(
    new Option("--project <name>", "the name of the project being scanned").env(
      "PROJECT_NAME",
    ),
  )
  .addOption(
    new Option(
      "--owasp-bin <path>",
      "the path to a preinstalled dependency-check-cli binary",
    )
      .env("OWASP_BIN")
      .argParser(parseOwaspBinary),
  )
  .option(
    "--hide-owasp-output",
    "do not display the output of the dependency-check-cli binary",
    false,
  )
  .option("--ignore-errors", "always exit with code 0", false)
  .option(
    "-d, --data <path>",
    "the location of the data directory used to store persistent data",
    path.join(os.tmpdir(), "dependency-check-data"),
  )
  .option("-s, --scan <path...>", "the paths to scan ", ["package-lock.json"])
  .option("-f, --format <format...>", "the formats to generate", [
    "HTML",
    "JSON",
  ])
  .version(
    process.env.npm_package_version ?? "<unknown>",
    undefined,
    "print the version of the node module",
  )
  .addHelpText(
    "afterAll",
    `
You can also use any arguments supported by the Owasp Dependency Check CLI tool, see: https://jeremylong.github.io/DependencyCheck/dependency-check-cli/arguments.html

Some defaults are provided:
- project    Default: "name" from package.json in working directory
- data       Default: dependency-check-data directory in system temp folder
- format     Default: HTML and JSON
- scan       Default: package-lock.json in working directory

The following environment variables are supported:
- OWASP_BIN: path to a local installation of the Owasp Dependency Check CLI tool
- NVD_API_KET: personal NVD API key to authenticate against API
- GITHUB_TOKEN: personal GitHub token to authenticate against API`,
  )
  .parse();

export function hideOwaspOutput() {
  return cli.opts().hideOwaspOutput;
}

export function getOwaspBinary() {
  return Maybe.fromNullable(cli.opts().owaspBin);
}

export function getProxyUrl() {
  return Maybe.fromNullable(cli.opts().proxy);
}

export function getGitHubToken() {
  return Maybe.fromNullable(cli.opts().githubToken);
}

export function getOutDir() {
  return cli.opts().out;
}

export function forceInstall() {
  return cli.opts().forceInstall;
}

export function getOdcVersion() {
  return Maybe.fromNullable(cli.opts().odcVersion);
}

export function getBinDir() {
  return path.resolve(cli.opts().bin);
}

function getNvdApiKey() {
  return Maybe.fromNullable(cli.opts().nvdApiKey);
}

function getProject() {
  return Maybe.fromNullable(cli.opts().project);
}

export function getCmdArguments() {
  const args = ["--out", cli.opts().out, ...cli.args];

  getNvdApiKey().ifJust((key) => {
    args.push("--nvdApiKey", key);
  });

  cli.opts().scan.forEach((scan) => {
    args.push("--scan", scan);
  });

  args.push(
    "--project",
    getProject().orDefaultLazy(getProjectNameFromPackageJson),
  );

  args.push("--data", cli.opts().data);

  cli.opts().format.forEach((format) => {
    args.push("--format", format);
  });

  return args;
}

function getProjectNameFromPackageJson() {
  try {
    const packageJson = readFileSync(path.resolve("package.json")).toString();
    const parsedJson = JSON.parse(packageJson) as { name: string };
    return parsedJson.name;
  } catch (e) {
    const error = ensureError(e);
    logError(error.message);
  }
  return "Unknown Project";
}

function parseProxyUrl(value: string) {
  const url = URL.parse(value);
  if (!url?.protocol || !url.hostname) {
    throw new InvalidArgumentError("Invalid proxy URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidArgumentError("Invalid HTTP(S) proxy URL");
  }
  return url;
}

function parseOwaspBinary(value: string) {
  const binPath = path.resolve(value);
  if (!fs.existsSync(binPath)) {
    throw new InvalidArgumentError("Invalid path to OWASP binary");
  }
  return binPath;
}

export function exitProcess(code: number | null) {
  if (cli.opts().ignoreErrors) {
    process.exit(0);
  } else {
    process.exit(code);
  }
}

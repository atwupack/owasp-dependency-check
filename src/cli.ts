import {
  program,
  Option,
  InvalidArgumentError,
} from "@commander-js/extra-typings";
import path from "path";
import os from "os";
import fs from "fs";
import { Maybe } from "purify-ts";
import { ensureError, log, logError } from "./utils.js";
import { version } from "./version.js";

const command = program
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
  .version(version, undefined, "print the version of owasp-dependency-check")
  .addHelpText(
    "afterAll",
    `
You can also use any arguments supported by the dependency-check-cli, see: https://jeremylong.github.io/DependencyCheck/dependency-check-cli/arguments.html

Some defaults are provided:
- project    Default: "name" from package.json in working directory
- data       Default: dependency-check-data directory in system temp folder
- format     Default: HTML and JSON
- scan       Default: package-lock.json in working directory

The following environment variables are supported:
- OWASP_BIN: path to a local installation of the dependency-check-cli
- NVD_API_KET: personal NVD API key to authenticate against API
- GITHUB_TOKEN: personal GitHub token to authenticate against API`,
  )
  .parse();

const cli = {
  hideOwaspOutput: command.opts().hideOwaspOutput,
  owaspBinary: Maybe.fromNullable(command.opts().owaspBin),
  proxyUrl: Maybe.fromNullable(command.opts().proxy),
  githubToken: Maybe.fromNullable(command.opts().githubToken),
  outDir: command.opts().out,
  forceInstall: command.opts().forceInstall,
  odcVersion: Maybe.fromNullable(command.opts().odcVersion),
  binDir: path.resolve(command.opts().bin),
  nvdApiKey: getNvdApiKey(),
  projectName: getProjectName(),
  cmdArguments: buildCmdArguments(),
  ignoreErrors: command.opts().ignoreErrors,
};

export default cli;

function getProjectName() {
  return Maybe.fromNullable(command.opts().project);
}

function getNvdApiKey() {
  return Maybe.fromNullable(command.opts().nvdApiKey);
}

function buildCmdArguments() {
  const args = ["--out", command.opts().out, ...command.args];

  getNvdApiKey().ifJust((key) => {
    args.push("--nvdApiKey", key);
  });

  command.opts().scan.forEach((scan) => {
    args.push("--scan", scan);
  });

  args.push(
    "--project",
    getProjectName().orDefaultLazy(getProjectNameFromPackageJson),
  );

  args.push("--data", command.opts().data);

  command.opts().format.forEach((format) => {
    args.push("--format", format);
  });

  return args;
}

function getProjectNameFromPackageJson() {
  let projectName = "Unknown Project";
  try {
    const packageJson = fs
      .readFileSync(path.resolve("package.json"))
      .toString();
    const parsedJson = JSON.parse(packageJson) as { name: string };
    projectName = parsedJson.name;
    log(`Found project name "${projectName}" in package.json`);
  } catch (e) {
    const error = ensureError(e);
    logError(error.message);
  }
  return projectName;
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

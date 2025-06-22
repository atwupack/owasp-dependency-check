import {
  program,
  Option,
  InvalidArgumentError,
} from "@commander-js/extra-typings";
import path from "path";
import os from "os";
import fs from "fs";
import { Maybe } from "purify-ts";
import { ensureError, log, logWarning } from "./utils.js";
import { description, name, version } from "./info.js";

const command = program
  .allowUnknownOption()
  .name(name)
  .description(description)
  .argument(
    "[args...]",
    "additional arguments that will be passed to the dependency-check-cli",
  )
  .option(
    "-o, --out <path>",
    "the directory the generated reports will be written into",
    "dependency-check-reports",
  )
  .option(
    "--bin <path>",
    "the directory the dependency-check-cli will be installed into",
    "dependency-check-bin",
  )
  .option(
    "--force-install",
    "install the dependency-check-cli even if the version is already present (will be overwritten)",
  )
  .option(
    "--keep-old-versions",
    "do not remove old versions of the dependency-check-cli",
  )
  .option(
    "--odc-version <version>",
    "the version of the dependency-check-cli to install in the format: v1.2.3",
  )
  .option(
    "-p, --proxy <url>",
    "the URL of a proxy server in the format: http(s)://[user]:[password]@<server>:[port]",
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
    new Option("--project <name>", "the name of the project to be scanned").env(
      "PROJECT_NAME",
    ),
  )
  .addOption(
    new Option(
      "--owasp-bin <path>",
      `the path to a preinstalled dependency-check-cli binary (.sh or .bat file)`,
    )
      .env("OWASP_BIN")
      .argParser(parseOwaspBinary),
  )
  .option(
    "--hide-owasp-output",
    "do not display the output of the dependency-check-cli binary",
  )
  .option("--ignore-errors", "always exit with code 0")
  .option(
    "-d, --data <path>",
    "the location of the data directory used to store persistent data",
    path.join(os.tmpdir(), "dependency-check-data"),
  )
  .option("-s, --scan <path...>", "the paths to scan ", ["package-lock.json"])
  .option("-f, --format <format...>", "the formats of the report to generate", [
    "HTML",
    "JSON",
  ])
  .version(version, undefined, `print the version of ${name}`)
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
- GITHUB_TOKEN: personal GitHub token to authenticate against API
- PROJECT_NAME: the name of the project being scanned`,
  )
  .parse();

const cli = {
  hideOwaspOutput: !!command.opts().hideOwaspOutput,
  owaspBinary: Maybe.fromNullable(command.opts().owaspBin),
  proxyUrl: Maybe.fromNullable(command.opts().proxy),
  githubToken: Maybe.fromNullable(command.opts().githubToken),
  outDir: command.opts().out,
  forceInstall: !!command.opts().forceInstall,
  odcVersion: Maybe.fromNullable(command.opts().odcVersion),
  binDir: path.resolve(command.opts().bin),
  cmdArguments: buildCmdArguments(),
  ignoreErrors: !!command.opts().ignoreErrors,
  keepOldVersions: !!command.opts().keepOldVersions,
};

export default cli;

function buildCmdArguments() {
  const args = [
    "--out",
    command.opts().out,
    "--data",
    command.opts().data,
    ...command.args,
  ];

  Maybe.fromNullable(command.opts().nvdApiKey).ifJust((key) => {
    args.push("--nvdApiKey", key);
  });

  command.opts().scan.forEach((scan) => {
    args.push("--scan", scan);
  });

  args.push(
    "--project",
    command.opts().project ?? getProjectNameFromPackageJson(),
  );

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
    logWarning(error.message);
  }
  return projectName;
}

function parseProxyUrl(value: string) {
  const url = URL.parse(value);
  if (!url?.protocol || !url.hostname) {
    throw new InvalidArgumentError("The proxy URL is invalid.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InvalidArgumentError("The proxy URL is not HTTP(S).");
  }
  return url;
}

function parseOwaspBinary(value: string) {
  const binPath = path.resolve(value);
  if (fs.existsSync(binPath)) {
    const stat = fs.statSync(binPath);
    if (!stat.isFile()) {
      throw new InvalidArgumentError(
        "The dependency-check-cli binary is not a file.",
      );
    }
  } else {
    throw new InvalidArgumentError(
      "The dependency-check-cli binary does not exist.",
    );
  }
  return binPath;
}

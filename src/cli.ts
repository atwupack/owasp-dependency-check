import {
  program,
  Option,
  InvalidArgumentError,
} from "@commander-js/extra-typings";
import path from "path";
import os from "os";
import fs from "fs";
import { Maybe } from "purify-ts";
import { ensureError, resolveFile } from "./utils.js";
import { description, name, version } from "./info.js";
import { createLogger } from "./log.js";

const log = createLogger(name);

const command = program
  .configureOutput({
    writeErr(str: string) {
      log.error(str);
    },
  })
  .allowUnknownOption()
  .name(name)
  .description(description)
  .argument(
    "[args...]",
    "additional arguments that will be passed to the dependency-check-cli",
  )
  .optionsGroup("Installation options:")
  .option(
    "--bin <binary>",
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
  .addOption(
    new Option(
      "--github-token <token>",
      "GitHub token to authenticate against API",
    ).env("GITHUB_TOKEN"),
  )
  .optionsGroup("Execution options:")
  .addOption(
    new Option(
      "--owasp-bin <binary>",
      `the path to a preinstalled dependency-check-cli binary (.sh or .bat file)`,
    )
      .env("OWASP_BIN")
      .argParser(parseFile),
  )
  .option(
    "--hide-owasp-output",
    "do not display the output of the dependency-check-cli binary",
  )
  .option("--ignore-errors", "always exit with code 0")
  .addOption(
    new Option("--java-bin <binary>", "the path to the Java binary")
      .env("JAVACMD")
      .argParser(parseFile),
  )
  .optionsGroup("Network options:")
  .option(
    "-p, --proxy <url>",
    "the URL of a proxy server in the format: http(s)://[user]:[password]@<server>:[port]",
    parseProxyUrl,
  )
  .optionsGroup("OWASP dependency-check-cli options:")
  .option(
    "-o, --out <directory>",
    "the directory the generated reports will be written into",
    "dependency-check-reports",
  )
  .option(
    "-d, --data <directory>",
    "the location of the data directory used to store persistent data",
    path.join(os.tmpdir(), "dependency-check-data"),
  )
  .option(
    "-s, --scan <file...>",
    "the lock files of package managers to scan",
    parseMultipleFiles,
  )
  .option("-f, --format <format...>", "the formats of the report to generate", [
    "HTML",
    "JSON",
  ])
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
  .optionsGroup("General information:")
  .version(version, undefined, `print the version of ${name}`)
  .helpOption("-h, --help", "display this help information")
  .addHelpText(
    "afterAll",
    `
You can also use any arguments supported by the dependency-check-cli, see: https://jeremylong.github.io/DependencyCheck/dependency-check-cli/arguments.html

Some defaults are provided:
- project    Default: "name" from package.json in working directory
- data       Default: dependency-check-data directory in system temp folder
- format     Default: HTML and JSON
- scan       Default: package managers' lock files in working directory (package-lock.json, yarn.lock, pnpm-lock.yaml) 

The following environment variables are supported:
- OWASP_BIN: path to a local installation of the dependency-check-cli
- NVD_API_KET: personal NVD API key to authenticate against API
- GITHUB_TOKEN: personal GitHub token to authenticate against API
- PROJECT_NAME: the name of the project being scanned
- JAVACMD: path to a Java binary`,
  );

export function parseCli() {
  command.parse();
  return {
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
    javaBinary: Maybe.fromNullable(command.opts().javaBin),
  };
}

function addScanArgument(args: string[], lockFile: string) {
  resolveFile(lockFile).ifJust((value) => {
    log.info(`Found "${value}" and adding it to --scan argument.`);
    args.push("--scan", value);
  });
}

const LOCK_FILES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

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

  const scan = command.opts().scan;
  if (scan) {
    scan.forEach((scan) => {
      args.push("--scan", scan);
    });
  } else {
    LOCK_FILES.forEach((file) => {
      addScanArgument(args, file);
    });
  }

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
    log.info(`Found project name "${projectName}" in package.json`);
  } catch (e) {
    const error = ensureError(e);
    log.warn(error.message);
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

function parseMultipleFiles(value: string, previous: string[] | undefined) {
  const file = parseFile(value);
  return [...(previous ?? []), file];
}

function parseFile(value: string) {
  const filePath = resolveFile(value);
  return filePath
    .ifNothing(() => {
      throw new InvalidArgumentError(`The file "${value}" does not exist.`);
    })
    .unsafeCoerce();
}

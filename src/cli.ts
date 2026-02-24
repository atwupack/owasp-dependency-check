import {
  program,
  Option,
  InvalidArgumentError,
} from "@commander-js/extra-typings";
import path from "node:path";
import os from "node:os";
import { Maybe } from "purify-ts";
import { readPackageJson } from "./util/misc.js";
import { description, name, version } from "./info.js";
import { createLogger } from "./util/log.js";
import { parseUrl } from "./util/net.js";
import { resolveFile } from "./util/fs.js";

const log = createLogger(name);

export enum SuppressionMode {
  CLI = "CLI",
  UI = "UI",
}

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
    [],
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
    new Option(
      "--ossIndexUsername <user>",
      "Sonatype OSS Index username to authenticate against API",
    ).env("OSS_INDEX_USERNAME"),
  )
  .addOption(
    new Option(
      "--ossIndexPassword <pass>",
      "Sonatype OSS Index password to authenticate against API",
    ).env("OSS_INDEX_PASSWORD"),
  )
  .addOption(
    new Option("--project <name>", "the name of the project to be scanned").env(
      "PROJECT_NAME",
    ),
  )
  .option(
    "--suppression <file>",
    "path to a suppression XML file (see --suppressionMode for how it is applied)",
    parseFile,
  )
  .addOption(
    new Option(
      "--suppressionMode <mode>",
      "controls how the suppression file is applied: CLI (pass to OWASP binary) or UI (annotate reports only)",
    ).choices(Object.values(SuppressionMode)).default(SuppressionMode.CLI),
  )
  .optionsGroup("General information:")
  .version(version, undefined, `print the version of ${name}`)
  .helpOption("-h, --help", "display this help information")
  .addHelpText(
    "afterAll",
    `
You can also use any arguments supported by the dependency-check-cli, see: https://jeremylong.github.io/DependencyCheck/dependency-check-cli/arguments.html

Some defaults are provided:
- project    Default: "<name> (<version>)" from package.json in working directory
- data       Default: dependency-check-data directory in system temp folder
- format     Default: HTML and JSON
- scan       Default: package managers' lock files in working directory (package-lock.json, yarn.lock, pnpm-lock.yaml) 

The following environment variables are supported:
- OWASP_BIN: path to a local installation of the dependency-check-cli
- NVD_API_KEY: personal NVD API key to authenticate against API
- OSS_INDEX_USERNAME: Sonatype OSS Index username to authenticate against API
- OSS_INDEX_PASSWORD: Sonatype OSS Index password to authenticate against API
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
    suppressionFile: Maybe.fromNullable(command.opts().suppression),
    suppressionMode: (command.opts().suppressionMode ?? SuppressionMode.CLI) as SuppressionMode,
    formats: command.opts().format,
  };
}

function addScanArgument(args: string[], lockFile: string) {
  resolveFile(lockFile).ifJust(value => {
    log.info(`Found "${value}" and adding it to --scan argument.`);
    args.push("--scan", value);
  });
}

const LOCK_FILES = [
  "package-lock.json",
  "npm-shrinkwrap.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

function buildCmdArguments() {
  const args = [
    "--out",
    command.opts().out,
    "--data",
    command.opts().data,
    ...command.args,
  ];

  Maybe.fromNullable(command.opts().nvdApiKey).ifJust(key => {
    args.push("--nvdApiKey", key);
  });

  Maybe.fromNullable(command.opts().ossIndexUsername).ifJust(user => {
    args.push("--ossIndexUsername", user);
  });

  Maybe.fromNullable(command.opts().ossIndexPassword).ifJust(pass => {
    args.push("--ossIndexPassword", pass);
  });

  const scan = command.opts().scan;
  if (scan.length > 0) {
    scan.forEach(scan => {
      args.push("--scan", scan);
    });
  } else {
    LOCK_FILES.forEach(file => {
      addScanArgument(args, file);
    });
  }

  args.push("--project", command.opts().project ?? buildProjectLabel());

  command.opts().format.forEach(format => {
    args.push("--format", format);
  });

  const suppressionMode = command.opts().suppressionMode ?? SuppressionMode.CLI;
  if (suppressionMode === SuppressionMode.CLI) {
    Maybe.fromNullable(command.opts().suppression).ifJust(file => {
      args.push("--suppression", file);
    });
  }

  return args;
}

function buildProjectLabel() {
  return readPackageJson()
    .map(packageJson => `${packageJson.name} (${packageJson.version})`)
    .orDefault("Unknown Project");
}

export function parseProxyUrl(value: string) {
  return parseUrl(value)
    .filter(url => url.protocol === "http:" || url.protocol === "https:")
    .toEither(new InvalidArgumentError("The proxy URL is invalid."))
    .unsafeCoerce();
}

export function parseFile(path: string) {
  const filePath = resolveFile(path);
  return filePath
    .toEither(new InvalidArgumentError(`The file "${path}" does not exist.`))
    .unsafeCoerce();
}

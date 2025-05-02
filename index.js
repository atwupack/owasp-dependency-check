#!/usr/bin/env node
import {program} from "commander";
import  { run } from './lib/dependency-check.js';

program
    .allowExcessArguments()
  .allowUnknownOption()
  .option('-o, --out <path>', 'the folder to write reports to', './dependency-check-reports')
  .option('--bin <path>', 'directory to which the dependency-check CLI will be installed', './dependency-check-bin')
  .option('--force-install', 'install the dependency-check CLI even if there already is one (will be overwritten)')
  .option('--odc-version <version>', 'the version of the dependency-check CLI to install in format "v1.2.3" or "latest"', 'latest')
    .option('-p, --proxy <url>', 'the URL to a proxy server in the format http(s)://[user]:[password]@<server>:[port]');

  program.addHelpText('after', `
You can also use any arguments supported by the Owasp Dependency Check CLI tool, see: https://jeremylong.github.io/DependencyCheck/dependency-check-cli/arguments.html

Some defaults are provided:
- project    Default: "name" from package.json in working directory
- data       Default: dependency-check-data directory in system temp folder
- format     Default: HTML and JSON
- scan       Default: 'src' folder in working directory`);

program.parse();
run();

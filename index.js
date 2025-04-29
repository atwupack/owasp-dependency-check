#!/usr/bin/env node

const { program } = require('commander');
const { run } = require('./lib/dependency-check');

program
    .allowExcessArguments()
  .allowUnknownOption()
  .option('-o, --out <path>', 'the folder to write reports to', './dependency-check-reports')
  .option('--bin <path>', 'directory to which the dependency-check CLI will be installed', './dependency-check-bin')
  .option('--force-install', 'install the dependency-check CLI even if there already is one (will be overwritten)')
  .option('--odc-version <version>', 'the version of the dependency-check CLI to install in format "v1.2.3" or "latest"', 'latest');

  program.addHelpText('after', `
You can also use any arguments supported by the Owasp Dependency Check CLI tool, see: https://jeremylong.github.io/DependencyCheck/dependency-check-cli/arguments.html

Some defaults are provided:
- project    Default: "name" from package.json in working directory
- data       Default: /tmp/dependency-check-data
- format     Default: HTML and JSON
- scan       Default: 'src' folder in working directory`);

program.parse();
run();

import {program} from "@commander-js/extra-typings";
import path from "path";
import os from "os";
import {readFileSync} from "fs";

const cli = program
    .allowExcessArguments()
    .allowUnknownOption()
    .option('-o, --out <path>', 'the folder to write reports to', 'dependency-check-reports')
    .option('--bin <path>', 'directory to which the dependency-check CLI will be installed', 'dependency-check-bin')
    .option('--force-install', 'install the dependency-check CLI even if there already is one (will be overwritten)', false)
    .option('--odc-version <version>', 'the version of the dependency-check CLI to install in format "v1.2.3" or "latest"', 'latest')
    .option('-p, --proxy <url>', 'the URL to a proxy server in the format http(s)://[user]:[password]@<server>:[port]')
    .option('--github-token <token>', 'personal GitHub token to authenticate against API')
    .addHelpText('after', `
You can also use any arguments supported by the Owasp Dependency Check CLI tool, see: https://jeremylong.github.io/DependencyCheck/dependency-check-cli/arguments.html

Some defaults are provided:
- project    Default: "name" from package.json in working directory
- data       Default: dependency-check-data directory in system temp folder
- format     Default: HTML and JSON
- scan       Default: package-lock.json in working directory

The following environment variables are supported:
- OWASP_BIN: path to a local installation of the Owasp Dependency Check CLI tool
- NVD_API_KET: personal NVD API key to authenticate against API
- GITHUB_TOKEN: personal GitHub token to authenticate against API`).parse();

export function getProxyUrl() {
    return cli.opts().proxy;
}

export function getGitHubToken() {
    if (cli.opts().githubToken) {
        return cli.opts().githubToken;
    }
    if (process.env.GITHUB_TOKEN) {
        return process.env.GITHUB_TOKEN;
    }
    return undefined
}

export function getOutDir() {
    return cli.opts().out;
}

export function forceInstall() {
    return cli.opts().forceInstall;
}

export function getOdcVersion() {
    return cli.opts().odcVersion;
}

export function getBinDir() {
    return path.resolve(cli.opts().bin, cli.opts().odcVersion);
}


export function getCmdArguments() {
    const args = [
        `--out=${cli.opts().out}`,
        ...cli.args
    ];

    if (!hasCmdArg(args, '--nvdApiKey') && process.env.NVD_API_KEY) {
        args.push(`--nvdApiKey="${process.env.NVD_API_KEY}"`);
    }

    if (!hasCmdArg(args, '--project')) {
        args.push(`--project="${getProjectName()}"`);
    }

    if (!hasCmdArg(args, '-d') && !hasCmdArg(args, '--data')) {
        args.push(`--data="${path.join(os.tmpdir(), 'dependency-check-data')}"`);
    }

    if (!hasCmdArg(args, '-f') && !hasCmdArg(args, '--format')) {
        args.push('--format=HTML');
        args.push('--format=JSON');
    }

    if (!hasCmdArg(args, '-s') && !hasCmdArg(args, '--scan')) {
        args.push('--scan=package-lock.json');
    }

    return args;
}

function hasCmdArg(args: string[], argPrefix: string) {
    return args.find(arg => arg.startsWith(`${argPrefix}=`) || arg.startsWith(`${argPrefix} `) || arg === argPrefix);
}

function getProjectName() {
    let projectName = process.env.PROJECT_NAME;

    if (!projectName) {
        try {
            const packageJson = readFileSync(path.resolve('package.json')).toString();
            const parsedJson = JSON.parse(packageJson) as {name: string};
            projectName = parsedJson.name;
        }
        catch (e) {
            console.error(e);
        }
    }
    return projectName ?? 'Unknown Project';
}


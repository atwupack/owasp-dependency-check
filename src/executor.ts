import {cleanDir, getJavaToolOptions, log} from "./utils.js";
import path from "path";
import {SpawnOptions, SpawnSyncOptionsWithBufferEncoding, SpawnSyncOptionsWithStringEncoding} from "child_process";
import spawn from "cross-spawn";
import colors from '@colors/colors/safe.js';
import {getCmdArguments} from "./cli.js";

export async function runDependencyCheck(executable: string, outDir: string) {
    log('Dependency-Check Core path:', executable);
    await cleanDir(path.resolve(process.cwd(), outDir));

    const env = process.env;
    if (getJavaToolOptions()) {
        env.JAVA_TOOL_OPTIONS = getJavaToolOptions();
    }

    const versionSpawnOpts: SpawnOptions | SpawnSyncOptionsWithBufferEncoding | SpawnSyncOptionsWithStringEncoding = {
        cwd: path.resolve(process.cwd()),
        shell: false,
        encoding: 'utf-8'
    };
    const dependencyCheckSpawnOpts: SpawnOptions = {
        cwd: path.resolve(process.cwd()),
        shell: false,
        stdio: 'inherit'
    };

    const versionCmdArguments = ['--version'];
    const versionCmd = `${executable} ${versionCmdArguments.join(' ')}`;

    log('Running command:\n', versionCmd);
    const versionSpawn = spawn.sync(executable, versionCmdArguments, versionSpawnOpts);
    const versionSpawnResult = versionSpawn.stdout;

    const re = /\D* (\d+\.\d+\.\d+).*/;
    const versionMatch = re.exec(versionSpawnResult);
    log('Dependency-Check Core version:', versionMatch ? versionMatch[1] : versionSpawnResult);

    const dependencyCheckCmdArguments = getCmdArguments();
    const dependencyCheckCmd = `${executable} ${dependencyCheckCmdArguments.join(' ')}`;

    log('Running command:\n', dependencyCheckCmd);
    const dependencyCheckSpawn = spawn(executable, dependencyCheckCmdArguments, dependencyCheckSpawnOpts);
    dependencyCheckSpawn.on('close', () => {
        log(colors.green('Done.'));
    });
}

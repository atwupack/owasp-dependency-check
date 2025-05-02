import {cleanDir, getCmdArguments, getJavaToolOptions, log} from "./utils.js";
import path from "path";
import {exec} from "child_process";

export function runDependencyCheck(executable, outDir) {
    cleanDir(path.resolve(process.cwd(), outDir));

    let env = process.env;
    if (getJavaToolOptions()) {
        env.JAVA_TOOL_OPTIONS = getJavaToolOptions();
    }
    const opts = {
        cwd: path.resolve(process.cwd()),
        maxBuffer: 1024 * 1024 * 50,
        env: env,
    };

    const cmdVersion = `${executable} --version`;
    const cmd = `${executable} ${getCmdArguments()}`;

    exec(cmdVersion, opts, (err, _stdout, _stderr) => {
        if (err) {
            console.error(err || _stderr);
            return;
        }

        const versionMatch = _stdout.match(/\D* (\d+\.\d+\.\d+).*/);

        log('Dependency-Check Core path:', executable);
        log('Dependency-Check Core version:', versionMatch ? versionMatch[1] : _stdout);

        log('Running command:\n', cmd);
        exec(cmd, opts, (err, _stdout, _stderr) => {
            if (err) {
                console.error(err || _stderr);
                return;
            }

            log('Done.'.green);
        })
    })
}

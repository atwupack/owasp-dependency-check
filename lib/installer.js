import {cleanDir} from "./utils.js";
import fetch from "node-fetch";
import Downloader from "nodejs-file-downloader";
import extract from "extract-zip";
import path from "path";
import fs from "fs";

const LOG_FILE_NAME = 'dependency-check.log';
const NAME_RE = /^dependency-check-\d+\.\d+\.\d+-release\.zip$/;
const LATEST_RELEASE_URL = 'https://api.github.com/repos/dependency-check/DependencyCheck/releases/latest';
const TAG_RELEASE_URL = 'https://api.github.com/repos/dependency-check/DependencyCheck/releases/tags/';

async function findDownloadUrl(odcVersion) {
    // if the odc version is the latest use the latest URL, otherwise use version URL
    const url = odcVersion === 'latest' ? LATEST_RELEASE_URL : TAG_RELEASE_URL + odcVersion;
    const res = await fetch(url);
    const body = await res.text();
    const json = JSON.parse(body);
    return json.assets.find(a => NAME_RE.test(a.name));
}

/**
 * Install the OWASP Dependency Check binary.
 * @param installDir the directory to install into.
 * @param odcVersion the version to be installed or 'latest'
 * @returns {Promise<void>}
 */
export async function install(installDir, odcVersion) {
    await cleanDir(installDir);

    try {
        const asset = await findDownloadUrl(odcVersion);

        const downloader = new Downloader({
            url: asset.browser_download_url,
            directory: installDir,
            fileName: asset.name,
        });
        await downloader.download();

        await extract(path.resolve(installDir, asset.name), {
            dir: installDir,
        });
    }
    catch (e) {
        // TODO: why does only this part write into a log file?
        console.error(`Failed to download and install. See ${LOG_FILE_NAME} for more details.`);
        fs.writeFileSync(LOG_FILE_NAME, `${e}`);
        process.exit(1); // TODO: that's not good
    }
}

import {cleanDir, getBinDir} from "./utils.js";
import {program} from "commander";
import fetch from "node-fetch";
import Downloader from "nodejs-file-downloader";
import extract from "extract-zip";
import path from "path";
import fs from "fs";

const LOG_FILE_NAME = 'dependency-check.log';
const NAME_RE = /^dependency-check-\d+\.\d+\.\d+-release\.zip$/;
const LATEST_RELEASE_URL = 'https://api.github.com/repos/dependency-check/DependencyCheck/releases/latest';
const TAG_RELEASE_URL = 'https://api.github.com/repos/dependency-check/DependencyCheck/releases/tags/';

async function findDownloadUrl() {
    // if the odc version is the latest use the latest URL, otherwise use version URL
    const url = program.opts().odcVersion === 'latest' ? LATEST_RELEASE_URL : TAG_RELEASE_URL + program.opts().odcVersion;
    const res = await fetch(url);
    const body = await res.text();
    const json = JSON.parse(body);
    return json.assets.find(a => NAME_RE.test(a.name));
}

export async function install() {
    const binDir = getBinDir();

    await cleanDir(binDir);

    try {
        const asset = await findDownloadUrl();

        const downloader = new Downloader({
            url: asset.browser_download_url,
            directory: binDir,
            fileName: asset.name,
        });
        await downloader.download();

        await extract(path.resolve(binDir, asset.name), {
            dir: binDir,
        });
    }
    catch (e) {
        console.error(`Failed to download and install. See ${LOG_FILE_NAME} for more details.`);
        fs.writeFileSync(LOG_FILE_NAME, `${e}`);
        process.exit(1);
    }
}

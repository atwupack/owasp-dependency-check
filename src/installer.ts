import { cleanDir, ensureError, exitProcess } from "./utils.js";
import fetch, { RequestInit } from "node-fetch";
import { Downloader, DownloaderConfig } from "nodejs-file-downloader";
import extract from "extract-zip";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getGitHubToken, getProxyUrl } from "./cli.js";

const NAME_RE = /^dependency-check-\d+\.\d+\.\d+-release\.zip$/;
const LATEST_RELEASE_URL =
  "https://api.github.com/repos/dependency-check/DependencyCheck/releases/latest";
const TAG_RELEASE_URL =
  "https://api.github.com/repos/dependency-check/DependencyCheck/releases/tags/";

interface GithubReleases {
  assets?: {
    name: string;
    browser_download_url: string;
  }[];
}

async function findDownloadAsset(odcVersion: string) {
  // if the odc version is the latest, use the latest URL, otherwise use version URL
  const url =
    odcVersion === "latest" ? LATEST_RELEASE_URL : TAG_RELEASE_URL + odcVersion;
  const init: RequestInit = {};
  const proxyUrl = getProxyUrl();
  if (proxyUrl) {
    init.agent = new HttpsProxyAgent(proxyUrl);
  }
  const githubToken = getGitHubToken();
  if (githubToken) {
    init.headers = {
      Authorization: `Bearer ${githubToken}`,
    };
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Could not fetch release from GitHub: ${res.statusText}`);
  }
  const json = (await res.json()) as GithubReleases;
  if (!json.assets) {
    throw new Error("Could not find assets in release");
  }
  const asset = json.assets.find((a) => NAME_RE.test(a.name));
  if (!asset) {
    throw new Error(`Could not find asset for version ${odcVersion}`);
  }
  return asset;
}

async function downloadRelease(url: string, name: string, installDir: string) {
  const config: DownloaderConfig = {
    url: url,
    directory: installDir,
    fileName: name,
  };
  if (getProxyUrl()) {
    config.proxy = getProxyUrl();
  }
  const downloader = new Downloader(config);
  const report = await downloader.download();
  if (report.downloadStatus === "COMPLETE" && report.filePath) {
    return report.filePath;
  } else {
    throw new Error(`Download failed from ${url}`);
  }
}

async function unzipRelease(filePath: string, installDir: string) {
  await extract(filePath, {
    dir: installDir,
  });
}

export async function installDependencyCheck(
  installDir: string,
  odcVersion: string,
) {
  try {
    await cleanDir(installDir);

    const asset = await findDownloadAsset(odcVersion);
    const filePath = await downloadRelease(
      asset.browser_download_url,
      asset.name,
      installDir,
    );
    await unzipRelease(filePath, installDir);
  } catch (e) {
    const error = ensureError(e);
    console.error("Failed to download and install: ", error.message);
    exitProcess(1);
  }
}

import { cleanDir, ensureError } from "./utils.js";
import fetch, { RequestInit } from "node-fetch";
import { Downloader, DownloaderConfig } from "nodejs-file-downloader";
import extract from "extract-zip";
import { HttpsProxyAgent } from "https-proxy-agent";
import { exitProcess } from "./cli.js";
import { Maybe } from "purify-ts";

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

async function findDownloadAsset(
  odcVersion: string,
  proxyUrl: Maybe<URL>,
  githubToken: Maybe<string>,
) {
  // if the odc version is the latest, use the latest URL, otherwise use version URL
  const url =
    odcVersion === "latest" ? LATEST_RELEASE_URL : TAG_RELEASE_URL + odcVersion;
  const init: RequestInit = {};
  proxyUrl.ifJust((proxyUrl) => {
    init.agent = new HttpsProxyAgent(proxyUrl);
  });
  githubToken.ifJust((token) => {
    init.headers = {
      Authorization: `Bearer ${token}`,
    };
  });
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

async function downloadRelease(
  url: string,
  name: string,
  installDir: string,
  proxyUrl: Maybe<URL>,
) {
  const config: DownloaderConfig = {
    url: url,
    directory: installDir,
    fileName: name,
  };
  proxyUrl.ifJust((proxyUrl) => {
    config.proxy = proxyUrl.toString();
  });
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
  proxyUrl: Maybe<URL>,
  githubToken: Maybe<string>,
) {
  try {
    await cleanDir(installDir);

    const asset = await findDownloadAsset(odcVersion, proxyUrl, githubToken);
    const filePath = await downloadRelease(
      asset.browser_download_url,
      asset.name,
      installDir,
      proxyUrl,
    );
    await unzipRelease(filePath, installDir);
  } catch (e) {
    const error = ensureError(e);
    console.error("Failed to download and install: ", error.message);
    exitProcess(1);
  }
}

import { cleanDir, log } from "./utils.js";
import fetch, { RequestInit } from "node-fetch";
import { Downloader, DownloaderConfig } from "nodejs-file-downloader";
import extract from "extract-zip";
import { HttpsProxyAgent } from "https-proxy-agent";
import { Maybe } from "purify-ts";
import path from "path";
import fs from "fs";
import os from "os";

const NAME_RE = /^dependency-check-\d+\.\d+\.\d+-release\.zip$/;
const LATEST_RELEASE_URL =
  "https://api.github.com/repos/dependency-check/DependencyCheck/releases/latest";
const TAG_RELEASE_URL =
  "https://api.github.com/repos/dependency-check/DependencyCheck/releases/tags/";
const IS_WIN = os.platform() === "win32";

function findOwaspExecutable(installDir: string) {
  const executable = path.resolve(
    installDir,
    "dependency-check",
    "bin",
    `dependency-check.${IS_WIN ? "bat" : "sh"}`,
  );
  return Maybe.fromNullable(fs.existsSync(executable) ? executable : undefined);
}

interface GithubRelease {
  tag_name: string;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
}

async function findReleaseInfo(
  odcVersion: Maybe<string>,
  proxyUrl: Maybe<URL>,
  githubToken: Maybe<string>,
) {
  const url = odcVersion.mapOrDefault((value) => {
    return TAG_RELEASE_URL + value;
  }, LATEST_RELEASE_URL);
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
  return (await res.json()) as GithubRelease;
}

function findDownloadAsset(release: GithubRelease) {
  const asset = release.assets.find((a) => NAME_RE.test(a.name));
  if (!asset) {
    throw new Error(`Could not find asset for version ${release.tag_name}`);
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
    log("Download done.");
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

async function installRelease(
  release: GithubRelease,
  installDir: string,
  proxyUrl: Maybe<URL>,
) {
  await cleanDir(installDir);

  const asset = findDownloadAsset(release);

  const filePath = await downloadRelease(
    asset.browser_download_url,
    asset.name,
    installDir,
    proxyUrl,
  );
  await unzipRelease(filePath, installDir);
  return findOwaspExecutable(installDir).orDefaultLazy(() => {
    throw new Error(
      `Could not find Dependency-Check Core executable in ${installDir}`,
    );
  });
}

export async function installDependencyCheck(
  binDir: string,
  odcVersion: Maybe<string>,
  proxyUrl: Maybe<URL>,
  githubToken: Maybe<string>,
  forceInstall: boolean,
) {
  const release = await findReleaseInfo(odcVersion, proxyUrl, githubToken);

  const installDir = path.resolve(binDir, release.tag_name);
  const executable = findOwaspExecutable(installDir).filter(
    () => !forceInstall,
  );
  if (executable.isJust()) {
    return executable.unsafeCoerce();
  }

  return await installRelease(release, installDir, proxyUrl);
}

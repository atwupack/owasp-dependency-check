import { cleanDir, log } from "./utils.js";
import extract from "extract-zip";
import { Maybe } from "purify-ts";
import path from "path";
import fs from "fs";
import os from "os";
import { fetch, ProxyAgent, RequestInit } from "undici";
import fsp from "node:fs/promises";

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
  log(`Fetching release information from ${url}`);
  const res = await fetch(url, createRequestInit(proxyUrl, githubToken));
  if (!res.ok) {
    throw new Error(
      `Could not fetch release from GitHub: URL:${url} Status:${res.statusText}`,
    );
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
  log(`Downloading dependency check from ${url}...`);
  const response = await fetch(url, createRequestInit(proxyUrl, Maybe.empty()));
  const filepath = path.resolve(installDir, name);
  if (response.body) {
    await fsp.writeFile(filepath, response.body);
    log("Download done.");
    return filepath;
  } else {
    throw new Error(`Download failed from ${url}`);
  }
}

function createRequestInit(proxyUrl: Maybe<URL>, githubToken: Maybe<string>) {
  const init: RequestInit = {};
  proxyUrl.ifJust((proxyUrl) => {
    init.dispatcher = new ProxyAgent(proxyUrl.toString());
  });
  githubToken.ifJust((token) => {
    init.headers = {
      Authorization: `Bearer ${token}`,
    };
  });
  return init;
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
  log(`Installing dependency check ${release.tag_name}...`);
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
  log(`Found release ${release.tag_name} on GitHub.`);

  const installDir = path.resolve(binDir, release.tag_name);
  const executable = findOwaspExecutable(installDir).filter(
    () => !forceInstall,
  );
  if (executable.isJust()) {
    log(
      `Using already installed dependency check at "${executable.unsafeCoerce()}".`,
    );
    return executable.unsafeCoerce();
  }

  return await installRelease(release, installDir, proxyUrl);
}

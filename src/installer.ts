import {
  cleanDir,
  fetchUrl,
  orThrow,
  resolveFile,
  unzipFileIntoDirectory,
} from "./utils.js";
import { Maybe, MaybeAsync } from "purify-ts";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { ProxyAgent, RequestInit } from "undici";
import { createLogger } from "./log.js";
import { name } from "./info.js";
import * as yup from "yup";

const log = createLogger(`${name} Installation`);

const NAME_RE = /^dependency-check-\d+\.\d+\.\d+-release\.zip$/;
const LATEST_RELEASE_URL =
  "https://api.github.com/repos/dependency-check/DependencyCheck/releases/latest";
const TAG_RELEASE_URL =
  "https://api.github.com/repos/dependency-check/DependencyCheck/releases/tags/";
const IS_WIN = os.platform() === "win32";

function findOwaspExecutable(installDir: string) {
  return resolveFile(
    installDir,
    "dependency-check",
    "bin",
    `dependency-check.${IS_WIN ? "bat" : "sh"}`,
  );
}

const githubReleaseSchema = yup.object({
  tag_name: yup.string().required(),
  assets: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(),
        browser_download_url: yup.string().url().required(),
      }),
    )
    .required(),
});

type GithubRelease = yup.InferType<typeof githubReleaseSchema>;

export function castGithubRelease(data: unknown): MaybeAsync<GithubRelease> {
  return MaybeAsync(() => githubReleaseSchema.validate(data, { strict: true }));
}

function parseJson(response: Response) {
  return MaybeAsync(() => response.json());
}

function findReleaseInfo(
  odcVersion: Maybe<string>,
  proxyUrl: Maybe<URL>,
  githubToken: Maybe<string>,
) {
  const url = odcVersion.mapOrDefault(value => {
    return TAG_RELEASE_URL + value;
  }, LATEST_RELEASE_URL);
  log.info(`Fetching release information from ${url}`);

  return fetchUrl(url, createRequestInit(proxyUrl, githubToken))
    .chain(resp => parseJson(resp))
    .chain(data => castGithubRelease(data));
}

export function findDownloadAsset(release: GithubRelease) {
  return Maybe.fromNullable(release.assets.find(a => NAME_RE.test(a.name)));
}

async function downloadRelease(
  url: string,
  name: string,
  installDir: string,
  proxyUrl: Maybe<URL>,
) {
  log.info(`Downloading dependency check from ${url}...`);
  const body = (
    await fetchUrl(url, createRequestInit(proxyUrl, Maybe.empty()))
  ).chainNullable(resp => resp.body);
  if (body.isJust()) {
    const filepath = path.resolve(installDir, name);
    await fs.promises.writeFile(filepath, body.unsafeCoerce());
    log.info("Download done.");
    return filepath;
  } else {
    throw new Error(`Download failed from ${url}`);
  }
}

export function createRequestInit(
  proxyUrl: Maybe<URL>,
  githubToken: Maybe<string>,
) {
  const init: RequestInit = {};
  proxyUrl.ifJust(proxyUrl => {
    init.dispatcher = new ProxyAgent(proxyUrl.toString());
  });
  githubToken.ifJust(token => {
    init.headers = { Authorization: `Bearer ${token}` };
  });
  return init;
}

async function installRelease(
  release: GithubRelease,
  installDir: string,
  proxyUrl: Maybe<URL>,
) {
  log.info(`Installing dependency check ${release.tag_name}...`);
  cleanDir(installDir, log);

  const asset = orThrow(
    findDownloadAsset(release),
    `Could not find asset for version ${release.tag_name}`,
  );

  const filePath = await downloadRelease(
    asset.browser_download_url,
    asset.name,
    installDir,
    proxyUrl,
  );
  await unzipFileIntoDirectory(filePath, installDir, true, log);
  return orThrow(
    findOwaspExecutable(installDir),
    `Could not find Dependency-Check Core executable in ${installDir}`,
  );
}

export async function installDependencyCheck(
  binDir: string,
  odcVersion: Maybe<string>,
  proxyUrl: Maybe<URL>,
  githubToken: Maybe<string>,
  forceInstall: boolean,
  keepOldVersions: boolean,
) {
  const release = orThrow(
    await findReleaseInfo(odcVersion, proxyUrl, githubToken),
    `Could not fetch release from GitHub.`,
  );
  log.info(`Found release ${release.tag_name} on GitHub.`);

  const installDir = path.resolve(binDir, release.tag_name);
  const executable = findOwaspExecutable(installDir).filter(
    () => !forceInstall,
  );
  if (executable.isJust()) {
    log.info(
      `Using already installed dependency check at "${executable.unsafeCoerce()}".`,
    );
    return executable.unsafeCoerce();
  }

  if (!keepOldVersions) {
    cleanDir(binDir, log);
  }
  return installRelease(release, installDir, proxyUrl);
}

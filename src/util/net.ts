import { Maybe, MaybeAsync } from "purify-ts";
import undici, {
  HeadersInit,
  ProxyAgent,
  RequestInfo,
  RequestInit,
} from "undici";
import fs from "node:fs";

export function parseUrl(url: string) {
  return Maybe.encase(() => new URL(url));
}

export function fetchUrl(url: RequestInfo, init: RequestInit) {
  return MaybeAsync(() => undici.fetch(url, init)).filter(
    response => response.ok,
  );
}

export function fetchJson(url: RequestInfo, init: RequestInit) {
  return fetchUrl(url, init).chain(response =>
    MaybeAsync(() => response.json()),
  );
}

export function downloadFile(
  url: RequestInfo,
  init: RequestInit,
  filepath: string,
) {
  return fetchUrl(url, init)
    .chain(response => MaybeAsync.liftMaybe(Maybe.fromNullable(response.body)))
    .chain(body => MaybeAsync(() => fs.promises.writeFile(filepath, body)))
    .map(() => filepath);
}

export function buildRequestInit(
  proxyUrl: Maybe<URL>,
  headers: Maybe<HeadersInit>,
) {
  const init: RequestInit = {};
  proxyUrl.ifJust(proxyUrl => {
    init.dispatcher = new ProxyAgent(proxyUrl.toString());
  });
  headers.ifJust(headers => {
    init.headers = headers;
  });
  return init;
}

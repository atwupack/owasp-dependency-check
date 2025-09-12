import { Maybe, MaybeAsync } from "purify-ts";
import undici, { RequestInfo, RequestInit } from "undici";

export function parseUrl(url: string) {
  return Maybe.encase(() => new URL(url));
}

export function fetchUrl(url: RequestInfo, init: RequestInit) {
  return MaybeAsync(() => undici.fetch(url, init)).filter(
    response => response.ok,
  );
}

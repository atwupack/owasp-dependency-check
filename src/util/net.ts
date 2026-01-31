import { Either, EitherAsync, Left, Maybe, Right } from "purify-ts";
import undici, {
  HeadersInit,
  ProxyAgent,
  RequestInfo,
  RequestInit,
} from "undici";
import fs from "node:fs";
import { ensureError } from "./misc.js";

export function parseUrl(url: string) {
  return Maybe.encase(() => new URL(url));
}

function validateResponse(response: Response): Either<Error, Response> {
  if (!response.ok) {
    return Left(new Error(`HTTP error: ${response.status.toString()}`));
  }
  return Right(response);
}

export function fetchUrl(url: RequestInfo, init: RequestInit) {
  return EitherAsync(() => undici.fetch(url, init))
    .chain(response => EitherAsync.liftEither(validateResponse(response)))
    .mapLeft(ensureError);
}

export function fetchJson(url: RequestInfo, init: RequestInit) {
  return fetchUrl(url, init)
    .chain(response => EitherAsync(() => response.json()))
    .mapLeft(ensureError);
}

export function downloadFile(
  url: RequestInfo,
  init: RequestInit,
  filepath: string,
) {
  return fetchUrl(url, init)
    .map(response => Maybe.fromNullable(response.body))
    .chain(body =>
      EitherAsync(() => fs.promises.writeFile(filepath, body.unsafeCoerce())),
    )
    .mapLeft(ensureError)
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

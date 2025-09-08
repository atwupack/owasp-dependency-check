import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Maybe } from "purify-ts";
import {
  castGithubRelease,
  createRequestInit,
  findDownloadAsset,
} from "./installer.js";

void describe("installer.ts", () => {
  void describe("createRequestInit", () => {
    void it("should set dispatcher when proxyUrl is provided", () => {
      const proxyUrl = Maybe.of(new URL("https://proxy.com"));
      const result = createRequestInit(proxyUrl, Maybe.empty());
      assert.ok(result.dispatcher);
    });
    void it("should set Authorization header when githubToken is provided", () => {
      const githubToken = Maybe.of("token123");
      const result = createRequestInit(Maybe.empty(), githubToken);
      assert.deepEqual(result.headers, { Authorization: "Bearer token123" });
    });
    void it("should set both dispatcher and Authorization header when both are provided", () => {
      const proxyUrl = Maybe.of(new URL("https://proxy.com"));
      const githubToken = Maybe.of("token123");
      const result = createRequestInit(proxyUrl, githubToken);
      assert.ok(result.dispatcher);
      assert.deepEqual(result.headers, { Authorization: "Bearer token123" });
    });
    void it("should return empty object when neither proxyUrl nor githubToken is provided", () => {
      const result = createRequestInit(Maybe.empty(), Maybe.empty());
      assert.deepEqual(result, {});
    });
  });
  void describe("findDownloadAsset", () => {
    void it("should return Maybe with asset when asset name matches regex", () => {
      const release = {
        tag_name: "v1.0.0",
        assets: [
          {
            name: "dependency-check-1.0.0-release.zip",
            browser_download_url: "url1",
          },
          { name: "other.zip", browser_download_url: "url2" },
        ],
      };
      const result = findDownloadAsset(release);
      assert.ok(result.isJust());
      assert.equal(
        result.unsafeCoerce().name,
        "dependency-check-1.0.0-release.zip",
      );
    });
    void it("should return Nothing when no asset name matches regex", () => {
      const release = {
        tag_name: "v1.0.0",
        assets: [{ name: "other.zip", browser_download_url: "url2" }],
      };
      const result = findDownloadAsset(release);
      assert.ok(result.isNothing());
    });
    void it("should return Nothing when assets array is empty", () => {
      const release = { tag_name: "v1.0.0", assets: [] };
      const result = findDownloadAsset(release);
      assert.ok(result.isNothing());
    });
  });
  void describe("castGithubRelease", () => {
    void it("returns validated GithubRelease object for valid input", async () => {
      const data = {
        tag_name: "v2.0.0",
        assets: [
          {
            name: "dependency-check-2.0.0-release.zip",
            browser_download_url: "https://example.com/asset.zip",
          },
        ],
      };
      const result = await castGithubRelease(data);
      assert.ok(result.isJust());
      assert.equal(result.unsafeCoerce().tag_name, "v2.0.0");
      assert.equal(
        result.unsafeCoerce().assets[0].name,
        "dependency-check-2.0.0-release.zip",
      );
      assert.equal(
        result.unsafeCoerce().assets[0].browser_download_url,
        "https://example.com/asset.zip",
      );
    });
    void it("throws error when tag_name is missing", async () => {
      const data = {
        assets: [
          {
            name: "dependency-check-2.0.0-release.zip",
            browser_download_url: "https://example.com/asset.zip",
          },
        ],
      };
      const result = await castGithubRelease(data);
      assert.ok(result.isNothing());
    });
  });
});

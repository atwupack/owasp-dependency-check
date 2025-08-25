import { describe, it } from "node:test";
import { parseFile, parseProxyUrl } from "./cli.js";
import assert from "node:assert/strict";
import { InvalidArgumentError } from "@commander-js/extra-typings";

void describe("cli.ts", () => {
  void describe("parseProxyUrl", () => {
    void it("should create a URL", () => {
      const url = parseProxyUrl("http://user:password@server:8080");
      assert.equal(url.protocol, "http:");
      assert.equal(url.hostname, "server");
      assert.equal(url.port, "8080");
      assert.equal(url.username, "user");
      assert.equal(url.password, "password");
    });
    void it("should throw an InvalidArgumentError if URL could not be parsed", () => {
      assert.throws(
        () => parseProxyUrl("htt\\p://user:password@server:8080"),
        new InvalidArgumentError("The proxy URL is invalid."),
      );
    });
  });
  void describe("parseFile", () => {
    void it("should throw an error if file cannot be found", () => {
      assert.throws(
        () => parseFile("non-existing-file.txt"),
        new InvalidArgumentError(
          'The file "non-existing-file.txt" does not exist.',
        ),
      );
    });
  });
});

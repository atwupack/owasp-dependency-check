import { describe, it } from "node:test";
import { buildJavaToolOptions } from "./executor.js";
import assert from "node:assert/strict";

void describe("executor.ts", () => {
  void describe("buildJavaToolOptions", () => {
    void it("should return only host if URL has no other information", () => {
      const url = new URL("http://localhost");
      const result = buildJavaToolOptions(url);
      assert.equal(result, "-Dhttps.proxyHost=localhost");
    });
    void it("should return host and porn if provided", () => {
      const url = new URL("http://localhost:8080");
      const result = buildJavaToolOptions(url);
      assert.equal(
        result,
        "-Dhttps.proxyHost=localhost -Dhttps.proxyPort=8080",
      );
    });
    void it("should return all properties if full URL is provided", () => {
      const url = new URL("http://user:password@localhost:8080");
      const result = buildJavaToolOptions(url);
      assert.equal(
        result,
        "-Dhttps.proxyHost=localhost -Dhttps.proxyPort=8080 -Dhttps.proxyUser=user -Dhttps.proxyPassword=password",
      );
    });
  });
});

import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { ensureError, hideSecrets, orThrow } from "./misc.js";
import { Maybe } from "purify-ts";

void describe("utils.ts", () => {
  void describe("hideSecrets", () => {
    void it("should filter parameter with equal sign", () => {
      const result = hideSecrets("--nvdApiKey=1234567890");
      assert.equal(result, "--nvdApiKey=<secret value>");
    });
    void it("should filter parameter with space", () => {
      const result = hideSecrets("--nvdApiKey 1234567890");
      assert.equal(result, "--nvdApiKey <secret value>");
    });
    void it("should filter passwords", () => {
      const result = hideSecrets("--nvdPassword 1234567890");
      assert.equal(result, "--nvdPassword <secret value>");
    });
    void it("should filter tokens", () => {
      const result = hideSecrets("--nvdBearerToken 1234567890");
      assert.equal(result, "--nvdBearerToken <secret value>");
    });
    void it("should filter pass", () => {
      const result = hideSecrets("--nexusPass 1234567890");
      assert.equal(result, "--nexusPass <secret value>");
    });
    void it("should filter correct entry", () => {
      const result = hideSecrets(
        "--out dependency-check-reports --nvdApiToken=12345 --scan package-lock.json",
      );
      assert.equal(
        result,
        "--out dependency-check-reports --nvdApiToken=<secret value> --scan package-lock.json",
      );
    });
  });

  void describe("ensureError", () => {
    void it("should handle non-serializable object", () => {
      assert.equal(
        ensureError(BigInt("12345")).message,
        "This value was thrown as is, not through an Error: [Unable to stringify the thrown value]",
      );
    });
    void it("should return the error", () => {
      const error = new Error("Test Error");
      assert.equal(ensureError(error), error);
    });
    void it("should convert a string to an error with the string in the message", () => {
      const error = ensureError("Test Error");
      assert.equal(
        error.message,
        'This value was thrown as is, not through an Error: "Test Error"',
      );
    });
    void it("should convert an object to an error with the object in the message", () => {
      const obj = {
        message: "Test Error",
        stack: "Test Stack",
        name: "Test Name",
        code: "Test Code",
        errno: "Test Errno",
      };
      const error = ensureError(obj);
      assert.equal(
        error.message,
        'This value was thrown as is, not through an Error: {"message":"Test Error","stack":"Test Stack","name":"Test Name","code":"Test Code","errno":"Test Errno"}',
      );
    });
  });

  void describe("orThrow", () => {
    void it("should return the value when Maybe contains a value", () => {
      const value = orThrow(Maybe.of("data"), "Error message");
      assert.equal(value, "data");
    });

    void it("should throw an error with the provided message when Maybe is empty", () => {
      assert.throws(
        () => orThrow(Maybe.empty(), "Custom error"),
        error => error instanceof Error && error.message === "Custom error",
      );
    });
  });
});

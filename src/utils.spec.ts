import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { ensureError, hideSecrets, log } from "./utils.js";
import sinon from "sinon";

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

  void describe("log", () => {
    void it("should log to console", () => {
      sinon
        .mock(console)
        .expects("log")
        .once()
        .callsFake((input) => {
          assert.ok(input);
        });
      log("Test");
      sinon.restore();
    });
  });
});

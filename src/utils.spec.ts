import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { ensureError, hideSecrets, ifPresent, orElseGet, log } from "./utils.js";

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

void describe("ifPresent", () => {
  void it("should not call callback if undefined", () => {
    ifPresent(undefined, () => {
      throw new Error("Callback called");
    });
  });
  void it("should not call callback if null", () => {
    ifPresent(null, () => {
      throw new Error("Callback called");
    });
  });
  void it("should call callback if defined", () => {
    let called = false;
    ifPresent("test", () => {
      called = true;
    });
    assert.ok(called);
  })
})

void describe("orElseGet", () => {
  void it("should return provided value", () => {
    const result = orElseGet("Test", () => {return "Invalid"});
    assert.equal(result, "Test");
  });
  void it("should return callback value if input is undefined", () => {
    const result = orElseGet(undefined, () => {return "Valid"});
    assert.equal(result, "Valid");
  });
  void it("should return callback value if input is null", () => {
    const result = orElseGet(null, () => {return "Valid"});
    assert.equal(result, "Valid");
  });
});

void describe("log", () => {
  void it("should log to console", (t) => {
    const consoleMock = t.mock.method(console, "log");
    log("Test");
    assert.equal(consoleMock.mock.callCount(), 1);
  });
});

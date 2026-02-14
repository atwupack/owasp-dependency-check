import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { ensureError, hideSecrets, orThrow, readPackageJson } from "./misc.js";
import { Maybe } from "purify-ts";
import sinon from "sinon";
import fs from "node:fs";

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
      const error = Error("Test Error");
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

  void describe("readPackageJson", () => {
    void it("should read package.json file and return its content", () => {
      const fsMock = sinon.mock(fs);
      fsMock
        .expects("readFileSync")
        .once()
        .withArgs("package.json")
        .returns(Buffer.from('{"name": "my-package", "version": "1.0.0"}'));

      const packageJsonContent = readPackageJson();
      assert.ok(packageJsonContent.isJust());
      assert.equal(packageJsonContent.unsafeCoerce().name, "my-package");
      assert.equal(packageJsonContent.unsafeCoerce().version, "1.0.0");
      fsMock.verify();
    });
    void it("should validate the package.json file and return Nothing if it fails", () => {
      const fsMock = sinon.mock(fs);
      fsMock
        .expects("readFileSync")
        .once()
        .withArgs("package.json")
        .returns(Buffer.from('{"test": "my teste"}'));

      const packageJsonContent = readPackageJson();
      assert.ok(packageJsonContent.isNothing());
      fsMock.verify();
    });
    void it("should return Nothing if the file read fails", () => {
      const fsMock = sinon.mock(fs);
      fsMock
        .expects("readFileSync")
        .once()
        .withArgs("package.json")
        .throws(Error("FileNotFoundError"));

      const packageJsonContent = readPackageJson();
      assert.ok(packageJsonContent.isNothing());
      fsMock.verify();
    });
  });
});

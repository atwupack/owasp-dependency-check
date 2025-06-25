import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { cleanDir, ensureError, exitProcess, hideSecrets } from "./utils.js";
import sinon from "sinon";
import fs from "fs/promises";
import { createLogger } from "./log.js";

void describe("utils.ts", () => {
  void describe("cleanDir", () => {
    void it("should log a warning if directory could not be removed", async () => {
      const fsMock = sinon.mock(fs);
      fsMock.expects("rm").once().withArgs("test").rejects();
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").twice();

      const log = createLogger("Test");
      await cleanDir("test", log);

      fsMock.verify();
      consoleMock.verify();
    });
    void it("should re-create the directory after successful removal", async () => {
      const fsMock = sinon.mock(fs);
      fsMock.expects("rm").once().withArgs("test").resolves(undefined);
      fsMock.expects("mkdir").once().withArgs("test");
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").twice();

      const log = createLogger("Test");
      await cleanDir("test", log);

      fsMock.verify();
      consoleMock.verify();
    });
  });
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

  void describe("exitProcess", () => {
    void it("should exit with code 0 when not ignoring errors and called with 0", () => {
      const exitMock = sinon.mock(process);
      exitMock.expects("exit").once().withExactArgs(0);
      exitProcess(0, false);
      exitMock.verify();
    });
    void it("should exit with code 0 when ignoring errors and called with 0", () => {
      const exitMock = sinon.mock(process);
      exitMock.expects("exit").once().withExactArgs(0);
      exitProcess(0, true);
      exitMock.verify();
    });
    void it("should exit with code 1 when not ignoring errors and called with 1", () => {
      const exitMock = sinon.mock(process);
      exitMock.expects("exit").once().withExactArgs(1);
      exitProcess(1, false);
      exitMock.verify();
    });
    void it("should exit with code 0 when ignoring errors and called with 1", () => {
      const exitMock = sinon.mock(process);
      exitMock.expects("exit").once().withExactArgs(0);
      exitProcess(1, true);
      exitMock.verify();
    });
  });
});

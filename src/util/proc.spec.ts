import { describe, it } from "node:test";
import { Maybe, Nothing } from "purify-ts";
import assert from "node:assert/strict";
import { createLogger } from "./log.js";
import { setEnv, setExitCode, spawnSync } from "./proc.js";
import sinon from "sinon";
import spawn from "cross-spawn";
import { ensureError } from "./misc.js";

void describe("util/proc.ts", () => {
  void describe("exitProcess", () => {
    void it("should exit with code 0 when not ignoring errors and called with 0", () => {
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").once();

      const log = createLogger("Test");
      setExitCode(0, false, log);
      assert.equal(process.exitCode, 0);
      consoleMock.verify();
    });
    void it("should exit with code 0 when ignoring errors and called with 0", () => {
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").once();

      const log = createLogger("Test");
      setExitCode(0, true, log);
      assert.equal(process.exitCode, 0);
      consoleMock.verify();
    });
    void it("should exit with code 1 when not ignoring errors and called with 1", () => {
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").once();

      const log = createLogger("Test");
      setExitCode(1, false, log);
      assert.equal(process.exitCode, 1);
      consoleMock.verify();
    });
    void it("should exit with code 0 when ignoring errors and called with 1", () => {
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").twice();

      const log = createLogger("Test");
      setExitCode(1, true, log);
      assert.equal(process.exitCode, 0);
      consoleMock.verify();
    });
  });
  void describe("setEnv", () => {
    void it("should set environment variable when value is present and append is false", () => {
      const log = createLogger("Test");
      const key = "TEST_ENV";
      process.env[key] = undefined;
      setEnv(key, Maybe.of("value"), false, log);
      assert.equal(process.env[key], "value");
    });
    void it("should append to existing environment variable when append is true", () => {
      const log = createLogger("Test");
      const key = "TEST_ENV";
      process.env[key] = "existing";
      setEnv(key, Maybe.of("new"), true, log);
      assert.equal(process.env[key], "existing new");
    });
    void it("should not set environment variable when value is empty", () => {
      const log = createLogger("Test");
      const key = "TEST_ENV";
      process.env[key] = "existing";
      setEnv(key, Maybe.empty(), false, log);
      assert.equal(process.env[key], "existing");
    });
  });
  void describe("spawnSync", () => {
    void it("should return the spawned process result", () => {
      const spawnMock = sinon.mock(spawn);
      spawnMock.expects("sync").once().returns({ status: 0, stdout: "test" });
      const result = spawnSync("test", [], Nothing);
      assert.ok(result.isRight());
      assert.equal(result.unsafeCoerce().status, 0);
      assert.equal(result.unsafeCoerce().stdout, "test");
      spawnMock.verify();
    });
    void it("should return the error from the process", () => {
      const spawnMock = sinon.mock(spawn);
      spawnMock
        .expects("sync")
        .once()
        .returns({ error: Error("test") });
      const result = spawnSync("test", [], Nothing);
      assert.ok(result.isLeft());
      try {
        result.unsafeCoerce();
      } catch (e) {
        assert.equal(ensureError(e).message, "test");
      }
      spawnMock.verify();
    });
    void it("should return an error if the process did not complete", () => {
      const spawnMock = sinon.mock(spawn);
      spawnMock.expects("sync").once().returns({ status: null });
      const result = spawnSync("test", [], Nothing);
      assert.ok(result.isLeft());
      try {
        result.unsafeCoerce();
      } catch (e) {
        assert.equal(
          ensureError(e).message,
          "Spawn did not complete with status code.",
        );
      }
      spawnMock.verify();
    });
    void it("should return the error thrown by spawn", () => {
      const spawnMock = sinon.mock(spawn);
      spawnMock.expects("sync").once().throws(Error("error"));
      const result = spawnSync("test", [], Nothing);
      assert.ok(result.isLeft());
      try {
        result.unsafeCoerce();
      } catch (e) {
        assert.equal(ensureError(e).message, "error");
      }
      spawnMock.verify();
    });
  });
});

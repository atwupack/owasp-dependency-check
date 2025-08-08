import { describe, it } from "node:test";
import sinon from "sinon";
import assert from "node:assert/strict";
import { createLogger } from "./log.js";

void describe("log.ts", () => {
  void describe("log.info", () => {
    void it("should log to console", () => {
      const consoleMock = sinon.mock(console);
      consoleMock
        .expects("log")
        .once()
        .callsFake(input => {
          assert.ok(input);
        });
      const log = createLogger("Test");
      log.info("Test");
      consoleMock.verify();
    });
  });
  void describe("log.warn", () => {
    void it("should log to console", () => {
      const consoleMock = sinon.mock(console);
      consoleMock
        .expects("log")
        .once()
        .callsFake(input => {
          assert.ok(input);
        });
      const log = createLogger("Test");
      log.warn("Test");
      consoleMock.verify();
    });
  });
  void describe("log.error", () => {
    void it("should log to system error", () => {
      const consoleMock = sinon.mock(console);
      consoleMock
        .expects("error")
        .once()
        .callsFake(input => {
          assert.ok(input);
        });
      const log = createLogger("Test");
      log.error("Test");
      consoleMock.verify();
    });
  });
});

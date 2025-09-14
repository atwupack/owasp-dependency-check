import { describe, it } from "node:test";
import sinon from "sinon";
import fs, { Stats } from "node:fs";
import { createLogger } from "./log.js";
import { cleanDir, deleteQuietly, resolveFile } from "./fs.js";
import path from "node:path";
import assert from "node:assert/strict";
import { Maybe } from "purify-ts";

void describe("util/fs.ts", () => {
  void describe("deleteQuietly", () => {
    void it("should log a warning if directory could not be removed", () => {
      const fsMock = sinon.mock(fs);
      fsMock
        .expects("rmSync")
        .once()
        .withArgs("test", { force: true, recursive: true })
        .throws();
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").once();
      const log = createLogger("Test");
      deleteQuietly("test", true, log);
      fsMock.verify();
      consoleMock.verify();
    });
  });
  void describe("cleanDir", () => {
    void it("should log a warning if directory could not be removed", () => {
      const fsMock = sinon.mock(fs);
      fsMock.expects("rmSync").once().withArgs("test").throws();
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").twice();

      const log = createLogger("Test");
      cleanDir("test", log);

      fsMock.verify();
      consoleMock.verify();
    });
    void it("should re-create the directory after successful removal", () => {
      const fsMock = sinon.mock(fs);
      fsMock.expects("rmSync").once().withArgs("test");
      fsMock.expects("mkdirSync").once().withArgs("test");
      const consoleMock = sinon.mock(console);
      consoleMock.expects("log").twice();

      const log = createLogger("Test");
      cleanDir("test", log);

      fsMock.verify();
      consoleMock.verify();
    });
  });
  void describe("resolveFile", () => {
    void it("should return Nothing if the file does not exist", () => {
      const filePath = path.resolve("test");
      const fsMock = sinon.mock(fs);
      fsMock.expects("statSync").once().withArgs(filePath).throws();

      const file = resolveFile("test");
      assert.equal(file, Maybe.empty());
      fsMock.verify();
    });
    void it("should return Nothing if the path is not a file", () => {
      const statsMock = sinon.createStubInstance(Stats);
      statsMock.isFile.returns(false);
      const fsMock = sinon.mock(fs);
      const filePath = path.resolve("test");
      fsMock.expects("statSync").once().withArgs(filePath).returns(statsMock);

      const file = resolveFile("test");
      assert.equal(file, Maybe.empty());
      fsMock.verify();
    });
    void it("should return the resolved path if the path is a file", () => {
      const statsMock = sinon.createStubInstance(Stats);
      statsMock.isFile.returns(true);
      const fsMock = sinon.mock(fs);
      const filePath = path.resolve("test");
      fsMock.expects("statSync").once().withArgs(filePath).returns(statsMock);

      const file = resolveFile("test");
      assert.deepEqual(file, Maybe.of(path.resolve("test")));
      fsMock.verify();
    });
  });
});

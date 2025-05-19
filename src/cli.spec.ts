import { describe, it } from "node:test";
import { exitProcess } from "./cli.js";
import sinon from "sinon";
import { program } from "@commander-js/extra-typings";

void describe("cli.ts", () => {
  void describe("exitProcess", () => {
    void it("should exit with code 0 when not ignoring errors and called with 0", () => {
      const programMock = sinon.mock(program);
      programMock
        .expects("opts")
        .once()
        .callsFake(() => {
          return { ignoreErrors: false };
        });
      const exitMock = sinon.mock(process);
      exitMock.expects("exit").once().withExactArgs(0);
      exitProcess(0);
      sinon.restore();
    });
    void it("should exit with code 0 when ignoring errors and called with 0", () => {
      const programMock = sinon.mock(program);
      programMock
        .expects("opts")
        .once()
        .callsFake(() => {
          return { ignoreErrors: true };
        });
      const exitMock = sinon.mock(process);
      exitMock.expects("exit").once().withExactArgs(0);
      exitProcess(0);
      sinon.restore();
    });
    void it("should exit with code 1 when not ignoring errors and called with 1", () => {
      const programMock = sinon.mock(program);
      programMock
        .expects("opts")
        .once()
        .callsFake(() => {
          return { ignoreErrors: false };
        });
      const exitMock = sinon.mock(process);
      exitMock.expects("exit").once().withExactArgs(1);
      exitProcess(1);
      sinon.restore();
    });
    void it("should exit with code 0 when ignoring errors and called with 1", () => {
      const programMock = sinon.mock(program);
      programMock
        .expects("opts")
        .once()
        .callsFake(() => {
          return { ignoreErrors: true };
        });
      const exitMock = sinon.mock(process);
      exitMock.expects("exit").once().withExactArgs(0);
      exitProcess(1);
      sinon.restore();
    });
  });
});

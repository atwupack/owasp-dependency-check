import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Maybe } from "purify-ts";
import { processSuppression } from "./suppressor.js";

void describe("suppressor.ts", () => {
  void describe("processSuppression", () => {
    void it("should do nothing when no suppression file is provided", () => {
      assert.doesNotThrow(() => {
        processSuppression(Maybe.empty(), "some-dir", ["HTML", "JSON"]);
      });
    });

    void it("should do nothing when formats contain neither HTML nor JSON", () => {
      assert.doesNotThrow(() => {
        processSuppression(Maybe.empty(), "some-dir", ["XML", "CSV"]);
      });
    });

    void it("should do nothing when formats array is empty", () => {
      assert.doesNotThrow(() => {
        processSuppression(Maybe.empty(), "some-dir", []);
      });
    });
  });
});

import { describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { hideSecrets } from "./utils.js";

describe("hideSecrets", async () => {
  it("should filter parameter with equal sign", async () => {
    const result = hideSecrets("--nvdApiKey=1234567890");
    assert.equal(result, "--nvdApiKey=<secret value>");
  });
  it("should filter parameter with space", () => {
    const result = hideSecrets("--nvdApiKey 1234567890");
    assert.equal(result, "--nvdApiKey <secret value>");
  });
  it("should filter passwords", () => {
    const result = hideSecrets("--nvdPassword 1234567890");
    assert.equal(result, "--nvdPassword <secret value>");
  });
  it("should filter tokens", () => {
    const result = hideSecrets("--nvdBearerToken 1234567890");
    assert.equal(result, "--nvdBearerToken <secret value>");
  });
  it("should filter pass", () => {
    const result = hideSecrets("--nexusPass 1234567890");
    assert.equal(result, "--nexusPass <secret value>");
  });
});

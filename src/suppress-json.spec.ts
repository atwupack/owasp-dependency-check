import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchesPackageUrl, parseSuppressionXml } from "./suppress-json.js";

void describe("suppress-json.ts", () => {
  void describe("parseSuppressionXml", () => {
    void it("should parse a single suppress entry with one packageUrl", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<suppressions>
  <suppress>
    <packageUrl regex="true">^@adobe/aem-react-editable-components@.*$</packageUrl>
    <vulnerabilityName>CVE-2019-10768</vulnerabilityName>
  </suppress>
</suppressions>`;
      const result = parseSuppressionXml(xml);
      assert.equal(result.length, 1);
      assert.equal(result[0].packageUrls.length, 1);
      assert.equal(
        result[0].packageUrls[0].pattern,
        "^@adobe/aem-react-editable-components@.*$",
      );
      assert.equal(result[0].packageUrls[0].isRegex, true);
    });

    void it("should parse a suppress entry without regex attribute", () => {
      const xml = `<suppressions>
  <suppress>
    <packageUrl>pkg:npm/lodash@4.17.21</packageUrl>
  </suppress>
</suppressions>`;
      const result = parseSuppressionXml(xml);
      assert.equal(result.length, 1);
      assert.equal(result[0].packageUrls[0].pattern, "pkg:npm/lodash@4.17.21");
      assert.equal(result[0].packageUrls[0].isRegex, false);
    });

    void it("should parse multiple suppress entries", () => {
      const xml = `<suppressions>
  <suppress>
    <packageUrl regex="true">^yup@.*$</packageUrl>
  </suppress>
  <suppress>
    <packageUrl>pkg:npm/zod@4.1.11</packageUrl>
  </suppress>
</suppressions>`;
      const result = parseSuppressionXml(xml);
      assert.equal(result.length, 2);
    });

    void it("should return empty array for xml with no suppress entries", () => {
      const result = parseSuppressionXml("<suppressions></suppressions>");
      assert.equal(result.length, 0);
    });
  });

  void describe("matchesPackageUrl", () => {
    void it("should match a regex pattern against the name@version part of a PURL", () => {
      const result = matchesPackageUrl(
        "pkg:npm/@adobe/aem-react-editable-components@5.0.0",
        { pattern: "^@adobe/aem-react-editable-components@.*$", isRegex: true },
      );
      assert.equal(result, true);
    });

    void it("should match a regex pattern against the full PURL", () => {
      const result = matchesPackageUrl("pkg:npm/lodash@4.17.21", {
        pattern: "^pkg:npm/lodash@.*$",
        isRegex: true,
      });
      assert.equal(result, true);
    });

    void it("should not match when regex does not match", () => {
      const result = matchesPackageUrl("pkg:npm/lodash@4.17.21", {
        pattern: "^pkg:npm/moment@.*$",
        isRegex: true,
      });
      assert.equal(result, false);
    });

    void it("should match an exact packageUrl against the full PURL", () => {
      const result = matchesPackageUrl("pkg:npm/lodash@4.17.21", {
        pattern: "pkg:npm/lodash@4.17.21",
        isRegex: false,
      });
      assert.equal(result, true);
    });

    void it("should match an exact packageUrl against the name@version part", () => {
      const result = matchesPackageUrl("pkg:npm/lodash@4.17.21", {
        pattern: "lodash@4.17.21",
        isRegex: false,
      });
      assert.equal(result, true);
    });

    void it("should not match when exact pattern differs", () => {
      const result = matchesPackageUrl("pkg:npm/lodash@4.17.21", {
        pattern: "lodash@4.17.20",
        isRegex: false,
      });
      assert.equal(result, false);
    });
  });
});

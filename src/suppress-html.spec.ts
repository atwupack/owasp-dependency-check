import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addSuppressionColumnToHtml } from "./suppress-html.js";

void describe("suppress-html.ts", () => {
  void describe("addSuppressionColumnToHtml", () => {
    const makeHtml = (...rows: string[]) => `<html><body>
<table id="summaryTable" class="lined">
    <thead><tr style="text-align:left">
        <th class="sortable" data-sort="string">Dependency</th>
        <th class="sortable" data-sort="string">Package</th>
        <th class="sortable" data-sort="int">Evidence&nbsp;Count</th>
    </tr></thead>
${rows.join("\n")}
</table>
</body></html>`;

    const adobeRow = `    <tr class="notvulnerable">
        <td data-sort-value="@ADOBE/AEM-REACT-EDITABLE-COMPONENTS:2.1.1"><a href="#l1">@adobe/aem-react-editable-components:2.1.1</a></td>
        <td data-sort-value="pkg:npm/%40adobe%2Faem-react-editable-components@2.1.1">pkg:npm/...</td>
        <td>8</td>
    </tr>`;

    const lodashRow = `    <tr class="notvulnerable">
        <td data-sort-value="LODASH:4.17.21"><a href="#l2">lodash:4.17.21</a></td>
        <td data-sort-value="pkg:npm/lodash@4.17.21">pkg:npm/lodash@4.17.21</td>
        <td>5</td>
    </tr>`;

    const suppressionXml = `<suppressions>
  <suppress>
    <packageUrl regex="true">^@adobe/aem-react-editable-components@.*$</packageUrl>
    <vulnerabilityName>CVE-2019-10768</vulnerabilityName>
  </suppress>
</suppressions>`;

    void it("should add Suppressed column header to summaryTable thead", () => {
      const result = addSuppressionColumnToHtml(
        makeHtml(adobeRow),
        suppressionXml,
      );
      assert.ok(
        result.includes(
          '<th class="sortable" data-sort="string" title="Whether the dependency is suppressed">Suppressed</th>',
        ),
      );
    });

    void it("should add a checked checkbox for a suppressed dependency", () => {
      const result = addSuppressionColumnToHtml(
        makeHtml(adobeRow),
        suppressionXml,
      );
      assert.ok(
        result.includes(
          '<input type="checkbox" onclick="return false;" checked>',
        ),
      );
    });

    void it("should add an unchecked checkbox for a non-suppressed dependency", () => {
      const result = addSuppressionColumnToHtml(
        makeHtml(lodashRow),
        suppressionXml,
      );
      assert.ok(
        result.includes('<input type="checkbox" onclick="return false;">'),
      );
      assert.ok(!result.includes("checked>"));
    });

    void it("should correctly mark only the suppressed row when multiple rows are present", () => {
      const result = addSuppressionColumnToHtml(
        makeHtml(adobeRow, lodashRow),
        suppressionXml,
      );
      const checkedCount = (
        result.match(/onclick="return false;" checked/g) ?? []
      ).length;
      const uncheckedCount = (
        result.match(/<input type="checkbox" onclick="return false;">/g) ?? []
      ).length;
      assert.equal(checkedCount, 1);
      assert.equal(uncheckedCount, 1);
    });

    void it("should return the html unchanged when summaryTable is not present", () => {
      const html = "<html><body><p>No table here</p></body></html>";
      const result = addSuppressionColumnToHtml(html, suppressionXml);
      assert.equal(result, html);
    });
  });
});

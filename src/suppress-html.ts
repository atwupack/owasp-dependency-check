import fs from "node:fs";
import path from "node:path";
import { createLogger } from "./util/log.js";
import { name } from "./info.js";
import { parseSuppressionXml, matchesPackageUrl } from "./suppress-json.js";

const log = createLogger(`${name} Suppressor`);

const HTML_OUTPUT_FILE = "dependency-check-report.html";

export function addSuppressionColumnToHtml(
  html: string,
  xml: string,
): string {
  const suppressions = parseSuppressionXml(xml);

  const tableStartIndex = html.indexOf('<table id="summaryTable"');
  if (tableStartIndex === -1) return html;

  const tableEndIndex =
    html.indexOf("</table>", tableStartIndex) + "</table>".length;
  let tableHtml = html.slice(tableStartIndex, tableEndIndex);

  const theadEnd = "</thead>";
  const theadEndPos = tableHtml.indexOf(theadEnd);
  if (theadEndPos === -1) return html;

  let headPart = tableHtml.slice(0, theadEndPos);
  const bodyPart = tableHtml.slice(theadEndPos + theadEnd.length);

  // Insert Suppressed <th> before the closing </tr> of the thead
  const lastTrClose = headPart.lastIndexOf("</tr>");
  if (lastTrClose === -1) return html;
  headPart =
    headPart.slice(0, lastTrClose) +
    '\n                        <th class="sortable" data-sort="string" title="Whether the dependency is suppressed">Suppressed</th>\n                    ' +
    headPart.slice(lastTrClose);

  // Add a suppressed checkbox <td> to each data row
  const modifiedBody = bodyPart.replace(
    /(<tr[^>]*>)([\s\S]*?)(<\/tr>)/g,
    (match, openTag: string, content: string, closeTag: string) => {
      const packageUrlMatch = content.match(/data-sort-value="(pkg:[^"]+)"/);

      let isSuppressed = false;
      if (packageUrlMatch) {
        const purl = decodeURIComponent(packageUrlMatch[1]);
        isSuppressed = suppressions.some(suppression =>
          suppression.packageUrls.some(pu => matchesPackageUrl(purl, pu)),
        );
      }

      const checkbox = isSuppressed
        ? '\n                        <td data-sort-value="true" style="text-align:center"><input type="checkbox" onclick="return false;" checked></td>'
        : '\n                        <td data-sort-value="false" style="text-align:center"><input type="checkbox" onclick="return false;"></td>';

      return `${openTag}${content}${checkbox}${closeTag}`;
    },
  );

  tableHtml = headPart + theadEnd + modifiedBody;
  return html.slice(0, tableStartIndex) + tableHtml + html.slice(tableEndIndex);
}

export function processHtmlSuppression(xml: string, outDir: string): void {
  const htmlFile = path.join(outDir, HTML_OUTPUT_FILE);

  if (!fs.existsSync(htmlFile)) {
    log.warn(`HTML output file not found: ${htmlFile}`);
    return;
  }

  const html = fs.readFileSync(htmlFile, "utf-8");
  const modified = addSuppressionColumnToHtml(html, xml);
  fs.writeFileSync(htmlFile, modified);
  log.info("Updated HTML report with suppression status.");
}

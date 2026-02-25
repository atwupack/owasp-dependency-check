import fs from "node:fs";
import { Maybe } from "purify-ts";
import { createLogger } from "./util/log.js";
import { name } from "./info.js";
import { processJsonSuppression } from "./suppress-json.js";
import { processHtmlSuppression } from "./suppress-html.js";

const log = createLogger(`${name} Suppressor`);

export function processSuppression(
  suppressionFile: Maybe<string>,
  outDir: string,
  formats: string[],
): void {
  const upperFormats = formats.map(f => f.toUpperCase());
  const hasJson = upperFormats.includes("JSON");
  const hasHtml = upperFormats.includes("HTML");

  if (!hasJson && !hasHtml) return;

  suppressionFile.ifJust(filePath => {
    log.info(`Processing suppression file: ${filePath}`);
    const xml = fs.readFileSync(filePath, "utf-8");

    if (hasJson) {
      processJsonSuppression(xml, outDir);
    }

    if (hasHtml) {
      processHtmlSuppression(xml, outDir);
    }
  });
}

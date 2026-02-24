import fs from "node:fs";
import path from "node:path";
import { createLogger } from "./util/log.js";
import { name } from "./info.js";

const log = createLogger(`${name} Suppressor`);

const JSON_OUTPUT_FILE = "dependency-check-report.json";

interface PackageEntry {
  id: string;
}

interface Dependency {
  packages?: PackageEntry[];
  isSuppressed?: boolean;
}

interface ReportJson {
  dependencies?: Dependency[];
}

export interface PackageUrlPattern {
  pattern: string;
  isRegex: boolean;
}

export interface SuppressionEntry {
  packageUrls: PackageUrlPattern[];
}

export function parseSuppressionXml(xml: string): SuppressionEntry[] {
  const suppressions: SuppressionEntry[] = [];
  const suppressBlockRegex = /<suppress(?:\s[^>]*)?>[\s\S]*?<\/suppress>/g;

  let suppressMatch;
  while ((suppressMatch = suppressBlockRegex.exec(xml)) !== null) {
    const block = suppressMatch[0];
    const packageUrls: PackageUrlPattern[] = [];
    const packageUrlRegex = /<packageUrl([^>]*)>([\s\S]*?)<\/packageUrl>/g;

    let urlMatch;
    while ((urlMatch = packageUrlRegex.exec(block)) !== null) {
      const attrs = urlMatch[1];
      const pattern = urlMatch[2].trim();
      const isRegex = /regex\s*=\s*"true"/i.test(attrs);
      packageUrls.push({ pattern, isRegex });
    }

    if (packageUrls.length > 0) {
      suppressions.push({ packageUrls });
    }
  }

  return suppressions;
}

function stripPurlPrefix(packageId: string) {
  return packageId.replace(/^pkg:[^/]+\//, "");
}

export function matchesPackageUrl(
  packageId: string,
  entry: PackageUrlPattern,
): boolean {
  const { pattern, isRegex } = entry;
  const nameVersion = stripPurlPrefix(packageId);

  if (isRegex) {
    const regex = new RegExp(pattern);
    return regex.test(packageId) || regex.test(nameVersion);
  }

  return packageId === pattern || nameVersion === pattern;
}

function isDependencySuppressed(
  dependency: Dependency,
  suppressions: SuppressionEntry[],
): boolean {
  const packages = dependency.packages ?? [];
  return suppressions.some(suppression =>
    suppression.packageUrls.some(packageUrl =>
      packages.some(pkg => matchesPackageUrl(pkg.id, packageUrl)),
    ),
  );
}

export function processJsonSuppression(xml: string, outDir: string): void {
  const jsonFile = path.join(outDir, JSON_OUTPUT_FILE);

  if (!fs.existsSync(jsonFile)) {
    log.warn(`JSON output file not found: ${jsonFile}`);
    return;
  }

  const suppressions = parseSuppressionXml(xml);
  const reportJson: ReportJson = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));

  let suppressedCount = 0;
  reportJson.dependencies?.forEach(dep => {
    if (isDependencySuppressed(dep, suppressions)) {
      dep.isSuppressed = true;
      suppressedCount++;
    }
  });

  fs.writeFileSync(jsonFile, JSON.stringify(reportJson, null, 2));
  log.info(`Marked ${suppressedCount} dependencies as suppressed.`);
}

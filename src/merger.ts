import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./loader";

export type MergeStrategy = "first-wins" | "last-wins" | "error-on-conflict";

export interface MergeOptions {
  strategy: MergeStrategy;
  includeComments?: boolean;
}

export interface MergeResult {
  merged: Record<string, string>;
  conflicts: Array<{ key: string; values: string[] }>;
  sources: string[];
}

export function mergeRecords(
  records: Array<{ source: string; data: Record<string, string> }>,
  strategy: MergeStrategy = "last-wins"
): MergeResult {
  const merged: Record<string, string> = {};
  const conflictMap: Record<string, string[]> = {};
  const sources = records.map((r) => r.source);

  for (const { data } of records) {
    for (const [key, value] of Object.entries(data)) {
      if (key in merged && merged[key] !== value) {
        conflictMap[key] = conflictMap[key] ?? [merged[key]];
        conflictMap[key].push(value);
        if (strategy === "last-wins") merged[key] = value;
        if (strategy === "error-on-conflict") {
          throw new Error(`Conflict on key "${key}": "${merged[key]}" vs "${value}"`);
        }
      } else {
        if (!(key in merged) || strategy === "last-wins") {
          merged[key] = value;
        }
      }
    }
  }

  const conflicts = Object.entries(conflictMap).map(([key, values]) => ({ key, values }));
  return { merged, conflicts, sources };
}

export function mergeEnvFiles(filePaths: string[], options: MergeOptions = { strategy: "last-wins" }): MergeResult {
  const records = filePaths.map((filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");
    return { source: path.basename(filePath), data: parseEnvContent(content) };
  });
  return mergeRecords(records, options.strategy);
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(result.merged)) {
    lines.push(`${key}=${value}`);
  }
  return lines.join("\n");
}

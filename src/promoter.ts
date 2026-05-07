import { readFileSync, writeFileSync, existsSync } from "fs";
import { parseEnvContent } from "./loader";

export interface PromoteOptions {
  overwrite: boolean;
  dryRun: boolean;
}

export interface PromoteResult {
  promoted: string[];
  skipped: string[];
  missing: string[];
}

/**
 * Promotes values from a source env (e.g. .env.staging) into a target env
 * (e.g. .env.production) for keys that exist in a reference template.
 */
export function promoteEnv(
  sourceRecord: Record<string, string>,
  targetRecord: Record<string, string>,
  templateKeys: string[],
  options: PromoteOptions
): { result: Record<string, string>; summary: PromoteResult } {
  const promoted: string[] = [];
  const skipped: string[] = [];
  const missing: string[] = [];

  const output: Record<string, string> = { ...targetRecord };

  for (const key of templateKeys) {
    if (!(key in sourceRecord)) {
      missing.push(key);
      continue;
    }
    if (key in targetRecord && !options.overwrite) {
      skipped.push(key);
      continue;
    }
    output[key] = sourceRecord[key];
    promoted.push(key);
  }

  return { result: output, summary: { promoted, skipped, missing } };
}

export function loadEnvRecord(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf-8");
  return parseEnvContent(content);
}

export function serializeEnvRecord(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

export function writeEnvRecord(filePath: string, record: Record<string, string>): void {
  writeFileSync(filePath, serializeEnvRecord(record), "utf-8");
}

export function formatPromoteResult(summary: PromoteResult, dryRun: boolean): string {
  const lines: string[] = [];
  if (dryRun) lines.push("[dry-run] No changes written.");
  if (summary.promoted.length)
    lines.push(`Promoted (${summary.promoted.length}): ${summary.promoted.join(", ")}`);
  if (summary.skipped.length)
    lines.push(`Skipped (${summary.skipped.length}): ${summary.skipped.join(", ")}`);
  if (summary.missing.length)
    lines.push(`Missing in source (${summary.missing.length}): ${summary.missing.join(", ")}`);
  return lines.join("\n");
}

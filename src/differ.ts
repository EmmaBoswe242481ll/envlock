import * as fs from "fs";
import * as path from "path";

export interface EnvDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

export interface EnvSnapshot {
  keys: Record<string, string>;
  timestamp: string;
}

/**
 * Parse a .env file into a key-value record.
 */
export function parseEnvToRecord(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Compute the diff between two env records.
 */
export function diffEnvRecords(
  before: Record<string, string>,
  after: Record<string, string>
): EnvDiff {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const key of Object.keys(after)) {
    if (!(key in before)) {
      added.push(key);
    } else if (before[key] !== after[key]) {
      changed.push(key);
    }
  }

  for (const key of Object.keys(before)) {
    if (!(key in after)) {
      removed.push(key);
    }
  }

  return { added, removed, changed };
}

/**
 * Load an env file from disk and return its parsed record.
 */
export function loadEnvRecord(filePath: string): Record<string, string> {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved, "utf-8");
  return parseEnvToRecord(content);
}

/**
 * Compare two .env files and return their diff.
 */
export function compareEnvFiles(
  beforePath: string,
  afterPath: string
): EnvDiff {
  const before = loadEnvRecord(beforePath);
  const after = loadEnvRecord(afterPath);
  return diffEnvRecords(before, after);
}

/**
 * Format a diff result as a human-readable string.
 */
export function formatDiffResult(diff: EnvDiff): string {
  const lines: string[] = [];
  if (diff.added.length) lines.push(`Added:   ${diff.added.join(", ")}`);
  if (diff.removed.length) lines.push(`Removed: ${diff.removed.join(", ")}`);
  if (diff.changed.length) lines.push(`Changed: ${diff.changed.join(", ")}`);
  if (!lines.length) return "No differences found.";
  return lines.join("\n");
}

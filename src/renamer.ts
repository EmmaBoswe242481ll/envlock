/**
 * renamer.ts
 * Rename keys in .env files with optional dry-run and output support.
 */

import * as fs from "fs";
import { parseEnvContent } from "./loader";

export interface RenameRule {
  from: string;
  to: string;
}

export interface RenameResult {
  renamed: RenameRule[];
  notFound: string[];
  output: string;
}

export function applyRenames(
  content: string,
  rules: RenameRule[]
): RenameResult {
  const lines = content.split("\n");
  const renamed: RenameRule[] = [];
  const matched = new Set<string>();

  const updatedLines = lines.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) return line;

    const eqIdx = line.indexOf("=");
    const key = line.slice(0, eqIdx).trim();
    const rest = line.slice(eqIdx);

    const rule = rules.find((r) => r.from === key);
    if (rule) {
      matched.add(rule.from);
      renamed.push(rule);
      return `${rule.to}${rest}`;
    }
    return line;
  });

  const notFound = rules
    .filter((r) => !matched.has(r.from))
    .map((r) => r.from);

  return {
    renamed,
    notFound,
    output: updatedLines.join("\n"),
  };
}

export function parseRenameRules(raw: string[]): RenameRule[] {
  return raw.map((entry) => {
    const parts = entry.split(":");
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      throw new Error(
        `Invalid rename rule "${entry}". Expected format: OLD_KEY:NEW_KEY`
      );
    }
    return { from: parts[0].trim(), to: parts[1].trim() };
  });
}

export function formatRenameResult(result: RenameResult): string {
  const lines: string[] = [];
  if (result.renamed.length > 0) {
    lines.push("Renamed keys:");
    result.renamed.forEach((r) => lines.push(`  ${r.from} → ${r.to}`));
  }
  if (result.notFound.length > 0) {
    lines.push("Keys not found:");
    result.notFound.forEach((k) => lines.push(`  ${k}`));
  }
  if (result.renamed.length === 0 && result.notFound.length === 0) {
    lines.push("No rules applied.");
  }
  return lines.join("\n");
}

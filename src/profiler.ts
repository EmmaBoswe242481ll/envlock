import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./loader";

export interface EnvProfile {
  totalKeys: number;
  emptyValues: string[];
  longValues: string[];
  numericValues: string[];
  booleanValues: string[];
  urlValues: string[];
  secretLikeKeys: string[];
  averageValueLength: number;
}

const SECRET_PATTERNS = /secret|password|token|key|auth|api_key|private/i;
const URL_PATTERNS = /^https?:\/\//i;
const BOOL_VALUES = new Set(["true", "false", "1", "0", "yes", "no"]);

export function profileEnvRecord(record: Record<string, string>): EnvProfile {
  const keys = Object.keys(record);
  const emptyValues: string[] = [];
  const longValues: string[] = [];
  const numericValues: string[] = [];
  const booleanValues: string[] = [];
  const urlValues: string[] = [];
  const secretLikeKeys: string[] = [];
  let totalLength = 0;

  for (const key of keys) {
    const value = record[key];
    totalLength += value.length;

    if (value === "") emptyValues.push(key);
    if (value.length > 100) longValues.push(key);
    if (!isNaN(Number(value)) && value !== "") numericValues.push(key);
    if (BOOL_VALUES.has(value.toLowerCase())) booleanValues.push(key);
    if (URL_PATTERNS.test(value)) urlValues.push(key);
    if (SECRET_PATTERNS.test(key)) secretLikeKeys.push(key);
  }

  return {
    totalKeys: keys.length,
    emptyValues,
    longValues,
    numericValues,
    booleanValues,
    urlValues,
    secretLikeKeys,
    averageValueLength: keys.length > 0 ? Math.round(totalLength / keys.length) : 0,
  };
}

export function profileEnvFile(filePath: string): EnvProfile {
  const content = fs.readFileSync(path.resolve(filePath), "utf-8");
  const record = parseEnvContent(content);
  return profileEnvRecord(record);
}

export function formatProfileResult(profile: EnvProfile): string {
  const lines: string[] = [
    `Total keys:            ${profile.totalKeys}`,
    `Avg value length:      ${profile.averageValueLength} chars`,
    `Empty values:          ${profile.emptyValues.length} (${profile.emptyValues.join(", ") || "none"})`,
    `Long values (>100ch):  ${profile.longValues.length} (${profile.longValues.join(", ") || "none"})`,
    `Numeric values:        ${profile.numericValues.length} (${profile.numericValues.join(", ") || "none"})`,
    `Boolean values:        ${profile.booleanValues.length} (${profile.booleanValues.join(", ") || "none"})`,
    `URL values:            ${profile.urlValues.length} (${profile.urlValues.join(", ") || "none"})`,
    `Secret-like keys:      ${profile.secretLikeKeys.length} (${profile.secretLikeKeys.join(", ") || "none"})`,
  ];
  return lines.join("\n");
}

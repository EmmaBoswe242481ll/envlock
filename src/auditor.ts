import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./loader";
import { validateEnv, EnvSchema } from "./schema";

export interface AuditResult {
  file: string;
  missingKeys: string[];
  extraKeys: string[];
  invalidKeys: string[];
  passed: boolean;
}

export interface AuditOptions {
  envPath: string;
  schemaPath: string;
  strict?: boolean;
}

export function loadSchema(schemaPath: string): EnvSchema {
  const resolved = path.resolve(schemaPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Schema file not found: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, "utf-8");
  return JSON.parse(raw) as EnvSchema;
}

export function auditEnv(options: AuditOptions): AuditResult {
  const { envPath, schemaPath, strict = false } = options;

  const resolved = path.resolve(envPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Env file not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, "utf-8");
  const envVars = parseEnvContent(raw);
  const schema = loadSchema(schemaPath);

  const schemaKeys = Object.keys(schema);
  const envKeys = Object.keys(envVars);

  const missingKeys = schemaKeys.filter((k) => !(k in envVars));
  const extraKeys = strict ? envKeys.filter((k) => !(k in schema)) : [];

  const validationResult = validateEnv(envVars, schema);
  const invalidKeys = validationResult.errors
    ? validationResult.errors.map((e) => e.key)
    : [];

  const passed =
    missingKeys.length === 0 &&
    extraKeys.length === 0 &&
    invalidKeys.length === 0;

  return {
    file: envPath,
    missingKeys,
    extraKeys,
    invalidKeys,
    passed,
  };
}

export function formatAuditResult(result: AuditResult): string {
  const lines: string[] = [];
  lines.push(`Audit: ${result.file}`);
  lines.push(result.passed ? "  Status: PASSED" : "  Status: FAILED");

  if (result.missingKeys.length > 0) {
    lines.push(`  Missing keys (${result.missingKeys.length}):`);
    result.missingKeys.forEach((k) => lines.push(`    - ${k}`));
  }
  if (result.extraKeys.length > 0) {
    lines.push(`  Extra keys (${result.extraKeys.length}):`);
    result.extraKeys.forEach((k) => lines.push(`    + ${k}`));
  }
  if (result.invalidKeys.length > 0) {
    lines.push(`  Invalid keys (${result.invalidKeys.length}):`);
    result.invalidKeys.forEach((k) => lines.push(`    ! ${k}`));
  }

  return lines.join("\n");
}

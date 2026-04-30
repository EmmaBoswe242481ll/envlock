#!/usr/bin/env node
/**
 * interpolatorCli.ts
 * CLI entry point: resolve interpolations in a .env file and print results.
 */

import { readFileSync } from "fs";
import { parseEnvContent } from "./loader";
import { interpolateEnv, findUnresolvedRefs } from "./interpolator";

export interface InterpolateArgs {
  envFile: string;
  format: "dotenv" | "json";
  strict: boolean;
}

export function parseInterpolateArgs(argv: string[]): InterpolateArgs {
  const args = argv.slice(2);
  const envFile = args.find((a) => !a.startsWith("--")) ?? ".env";
  const format = args.includes("--json") ? "json" : "dotenv";
  const strict = args.includes("--strict");
  return { envFile, format, strict };
}

export function formatOutput(
  record: Record<string, string>,
  format: "dotenv" | "json"
): string {
  if (format === "json") {
    return JSON.stringify(record, null, 2);
  }
  return Object.entries(record)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export function runInterpolator(
  argv: string[],
  log = console.log,
  err = console.error
): number {
  const { envFile, format, strict } = parseInterpolateArgs(argv);

  let raw: string;
  try {
    raw = readFileSync(envFile, "utf-8");
  } catch {
    err(`Error: cannot read file "${envFile}"`);
    return 1;
  }

  const parsed = parseEnvContent(raw);
  const interpolated = interpolateEnv(parsed);
  const unresolved = findUnresolvedRefs(interpolated);

  if (strict && unresolved.length > 0) {
    for (const { key, ref } of unresolved) {
      err(`Unresolved reference: ${key} -> \$\{${ref}\}`);
    }
    return 1;
  }

  log(formatOutput(interpolated, format));
  return 0;
}

if (require.main === module) {
  process.exit(runInterpolator(process.argv));
}

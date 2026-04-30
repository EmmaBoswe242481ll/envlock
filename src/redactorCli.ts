#!/usr/bin/env node
/**
 * redactorCli.ts
 * CLI entry point for redacting sensitive values from .env files.
 */

import * as fs from "fs";
import * as path from "path";
import { redactEnvContent, RedactOptions } from "./redactor";

export type RedactCliArgs = {
  inputFile: string;
  outputFile?: string;
  mask?: string;
  extraKeys: string[];
};

export function parseRedactArgs(argv: string[]): RedactCliArgs {
  const args = argv.slice(2);
  const result: RedactCliArgs = { inputFile: ".env", extraKeys: [] };

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--input" || args[i] === "-i") && args[i + 1]) {
      result.inputFile = args[++i];
    } else if ((args[i] === "--output" || args[i] === "-o") && args[i + 1]) {
      result.outputFile = args[++i];
    } else if (args[i] === "--mask" && args[i + 1]) {
      result.mask = args[++i];
    } else if (args[i] === "--extra-keys" && args[i + 1]) {
      result.extraKeys = args[++i].split(",").map((k) => k.trim());
    }
  }

  return result;
}

export function runRedactor(argv: string[] = process.argv): void {
  const args = parseRedactArgs(argv);
  const inputPath = path.resolve(args.inputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, "utf-8");

  const options: RedactOptions = {
    ...(args.mask ? { mask: args.mask } : {}),
    ...(args.extraKeys.length ? { sensitiveKeys: args.extraKeys } : {}),
  };

  const redacted = redactEnvContent(content, options);

  if (args.outputFile) {
    const outputPath = path.resolve(args.outputFile);
    fs.writeFileSync(outputPath, redacted, "utf-8");
    console.log(`Redacted output written to: ${outputPath}`);
  } else {
    process.stdout.write(redacted + "\n");
  }
}

if (require.main === module) {
  runRedactor();
}

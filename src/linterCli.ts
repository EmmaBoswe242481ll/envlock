#!/usr/bin/env node
/**
 * linterCli.ts — CLI entry point for the env linter.
 * Usage: envlock lint [--json] <file...>
 */

import * as fs from 'fs';
import { lintEnvContent, formatLintResult, LintResult } from './linter';

export interface LintCliArgs {
  files: string[];
  json: boolean;
}

export function parseLintArgs(argv: string[]): LintCliArgs {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter(a => !a.startsWith('--'));
  if (files.length === 0) files.push('.env');
  return { files, json };
}

export function runLinter(argv: string[] = process.argv): void {
  const { files, json } = parseLintArgs(argv);
  const results: LintResult[] = [];
  let hasErrors = false;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exitCode = 1;
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = lintEnvContent(content, filePath);
    results.push(result);
    if (!result.valid) hasErrors = true;
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const result of results) {
      console.log(formatLintResult(result));
    }
  }

  if (hasErrors) process.exitCode = 1;
}

if (require.main === module) {
  runLinter();
}

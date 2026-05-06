import * as fs from 'fs';
import * as path from 'path';
import { trimEnvContent, trimEnvRecord, formatTrimResult } from './trimmer';
import { parseEnvContent } from './loader';

export interface TrimArgs {
  file: string;
  output?: string;
  dryRun: boolean;
  json: boolean;
}

export function parseTrimArgs(argv: string[]): TrimArgs {
  const args: TrimArgs = { file: '.env', dryRun: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--file' || arg === '-f') && argv[i + 1]) {
      args.file = argv[++i];
    } else if ((arg === '--output' || arg === '-o') && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--json') {
      args.json = true;
    }
  }
  return args;
}

export function runTrimmer(argv: string[]): void {
  const args = parseTrimArgs(argv);
  const filePath = path.resolve(args.file);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const original = parseEnvContent(content);
  const trimmedContent = trimEnvContent(content);
  const trimmed = parseEnvContent(trimmedContent);

  if (args.json) {
    const changed: Record<string, { before: string; after: string }> = {};
    for (const key of Object.keys(original)) {
      if (original[key] !== trimmed[key]) {
        changed[key] = { before: original[key], after: trimmed[key] };
      }
    }
    console.log(JSON.stringify({ file: args.file, changed }, null, 2));
    return;
  }

  const report = formatTrimResult(original, trimmed);
  console.log(report);

  if (!args.dryRun) {
    const dest = args.output ? path.resolve(args.output) : filePath;
    fs.writeFileSync(dest, trimmedContent, 'utf-8');
    console.log(`Written to ${dest}`);
  }
}

if (require.main === module) {
  runTrimmer(process.argv.slice(2));
}

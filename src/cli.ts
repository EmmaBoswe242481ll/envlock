#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { validateEnv } from './schema';
import { createSnapshot, writeSnapshot, readSnapshot, diffSnapshot } from './snapshot';
import { generateReport } from './reporter';

interface CliOptions {
  command: 'validate' | 'snapshot' | 'diff';
  envFile: string;
  schemaFile: string;
  snapshotFile: string;
  format: 'text' | 'json';
}

function parseCliArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const options: CliOptions = {
    command: 'validate',
    envFile: '.env',
    schemaFile: '.env.schema',
    snapshotFile: '.env.snapshot',
    format: 'text',
  };

  const command = args[0] as CliOptions['command'];
  if (['validate', 'snapshot', 'diff'].includes(command)) {
    options.command = command;
  }

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--env' && args[i + 1]) options.envFile = args[++i];
    else if (arg === '--schema' && args[i + 1]) options.schemaFile = args[++i];
    else if (arg === '--snapshot' && args[i + 1]) options.snapshotFile = args[++i];
    else if (arg === '--format' && args[i + 1]) options.format = args[++i] as 'text' | 'json';
  }

  return options;
}

function loadFile(filePath: string): string {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  return fs.readFileSync(resolved, 'utf-8');
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv);

  try {
    const envContent = loadFile(options.envFile);

    if (options.command === 'validate') {
      const schemaContent = loadFile(options.schemaFile);
      const result = validateEnv(envContent, schemaContent);
      const report = generateReport(result, options.format);
      console.log(report);
      process.exit(result.valid ? 0 : 1);
    }

    if (options.command === 'snapshot') {
      const snapshot = createSnapshot(envContent);
      writeSnapshot(options.snapshotFile, snapshot);
      console.log(`Snapshot written to ${options.snapshotFile}`);
      process.exit(0);
    }

    if (options.command === 'diff') {
      const existing = readSnapshot(options.snapshotFile);
      const current = createSnapshot(envContent);
      const diff = diffSnapshot(existing, current);
      const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;
      console.log(options.format === 'json' ? JSON.stringify(diff, null, 2) : formatDiff(diff));
      process.exit(hasChanges ? 1 : 0);
    }
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(2);
  }
}

function formatDiff(diff: { added: string[]; removed: string[]; changed: string[] }): string {
  const lines: string[] = [];
  if (diff.added.length) lines.push(`Added: ${diff.added.join(', ')}`);
  if (diff.removed.length) lines.push(`Removed: ${diff.removed.join(', ')}`);
  if (diff.changed.length) lines.push(`Changed: ${diff.changed.join(', ')}`);
  return lines.length ? lines.join('\n') : 'No changes detected.';
}

main();

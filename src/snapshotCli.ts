#!/usr/bin/env node
/**
 * CLI entry point for snapshot operations.
 * Usage:
 *   envlock snapshot create [--env .env] [--out .envlock-snapshot.json]
 *   envlock snapshot check  [--env .env] [--snapshot .envlock-snapshot.json]
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { createSnapshot, diffSnapshot, readSnapshot, writeSnapshot } from './snapshot';

const DEFAULT_ENV_FILE = '.env';
const DEFAULT_SNAPSHOT_FILE = '.envlock-snapshot.json';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && i + 1 < argv.length) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    } else if (!argv[i].startsWith('--')) {
      args['command'] = (args['command'] ?? '') + (args['command'] ? ' ' : '') + argv[i];
    }
  }
  return args;
}

function loadEnvKeys(envFile: string): string[] {
  if (!fs.existsSync(envFile)) {
    throw new Error(`Env file not found: ${envFile}`);
  }
  const parsed = dotenv.parse(fs.readFileSync(envFile, 'utf8'));
  return Object.keys(parsed);
}

export function run(argv: string[] = process.argv.slice(2)): void {
  const args = parseArgs(argv);
  const command = args['command'] ?? '';
  const envFile = args['env'] ?? DEFAULT_ENV_FILE;
  const snapshotFile = args['snapshot'] ?? args['out'] ?? DEFAULT_SNAPSHOT_FILE;

  if (command === 'snapshot create') {
    const keys = loadEnvKeys(envFile);
    const snapshot = createSnapshot(keys);
    writeSnapshot(snapshot, snapshotFile);
    console.log(`✔  Snapshot created at ${snapshotFile} (${keys.length} keys, checksum: ${snapshot.checksum})`);
    return;
  }

  if (command === 'snapshot check') {
    const keys = loadEnvKeys(envFile);
    const stored = readSnapshot(snapshotFile);
    const diff = diffSnapshot(keys, stored);

    if (diff.match) {
      console.log('✔  Env keys match snapshot.');
      return;
    }

    if (diff.added.length > 0) {
      console.error(`✖  New keys not in snapshot: ${diff.added.join(', ')}`);
    }
    if (diff.removed.length > 0) {
      console.error(`✖  Keys removed since snapshot: ${diff.removed.join(', ')}`);
    }
    process.exit(1);
    return;
  }

  console.error(`Unknown command: "${command}"`);
  console.error('Usage: envlock snapshot create|check [--env .env] [--snapshot .envlock-snapshot.json]');
  process.exit(1);
}

if (require.main === module) {
  run();
}

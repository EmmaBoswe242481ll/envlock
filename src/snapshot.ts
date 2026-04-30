import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface Snapshot {
  version: string;
  createdAt: string;
  keys: string[];
  checksum: string;
}

const SNAPSHOT_VERSION = '1';

/**
 * Generates a deterministic checksum from a sorted list of env keys.
 */
export function generateChecksum(keys: string[]): string {
  const sorted = [...keys].sort().join(',');
  return crypto.createHash('sha256').update(sorted).digest('hex').slice(0, 16);
}

/**
 * Creates a snapshot object from the provided env keys.
 */
export function createSnapshot(keys: string[]): Snapshot {
  return {
    version: SNAPSHOT_VERSION,
    createdAt: new Date().toISOString(),
    keys: [...keys].sort(),
    checksum: generateChecksum(keys),
  };
}

/**
 * Writes a snapshot to disk as JSON.
 */
export function writeSnapshot(snapshot: Snapshot, filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
}

/**
 * Reads and parses a snapshot from disk.
 * Throws if the file does not exist or is malformed.
 */
export function readSnapshot(filePath: string): Snapshot {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw) as Snapshot;
  } catch {
    throw new Error(`Failed to parse snapshot file: ${filePath}`);
  }
}

/**
 * Validates that a snapshot's checksum matches its keys.
 * Returns true if the snapshot is internally consistent, false otherwise.
 */
export function validateSnapshot(snapshot: Snapshot): boolean {
  const expected = generateChecksum(snapshot.keys);
  return snapshot.checksum === expected;
}

/**
 * Compares current env keys against a stored snapshot.
 * Returns an object describing added/removed keys and whether they match.
 */
export function diffSnapshot(
  current: string[],
  snapshot: Snapshot
): { match: boolean; added: string[]; removed: string[] } {
  const currentSet = new Set(current);
  const snapshotSet = new Set(snapshot.keys);

  const added = current.filter((k) => !snapshotSet.has(k));
  const removed = snapshot.keys.filter((k) => !currentSet.has(k));

  return {
    match: added.length === 0 && removed.length === 0,
    added,
    removed,
  };
}

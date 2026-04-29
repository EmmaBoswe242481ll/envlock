import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createSnapshot,
  diffSnapshot,
  generateChecksum,
  readSnapshot,
  writeSnapshot,
} from './snapshot';

describe('generateChecksum', () => {
  it('produces a 16-char hex string', () => {
    const checksum = generateChecksum(['FOO', 'BAR']);
    expect(checksum).toHaveLength(16);
    expect(checksum).toMatch(/^[0-9a-f]+$/);
  });

  it('is order-independent', () => {
    expect(generateChecksum(['A', 'B', 'C'])).toBe(generateChecksum(['C', 'A', 'B']));
  });

  it('differs for different key sets', () => {
    expect(generateChecksum(['A'])).not.toBe(generateChecksum(['B']));
  });
});

describe('createSnapshot', () => {
  it('sorts keys alphabetically', () => {
    const snap = createSnapshot(['ZEBRA', 'ALPHA', 'MIDDLE']);
    expect(snap.keys).toEqual(['ALPHA', 'MIDDLE', 'ZEBRA']);
  });

  it('includes a valid ISO date', () => {
    const snap = createSnapshot(['KEY']);
    expect(() => new Date(snap.createdAt)).not.toThrow();
  });

  it('includes a checksum matching the keys', () => {
    const keys = ['FOO', 'BAR'];
    const snap = createSnapshot(keys);
    expect(snap.checksum).toBe(generateChecksum(keys));
  });
});

describe('writeSnapshot / readSnapshot', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envlock-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('round-trips a snapshot to disk', () => {
    const snap = createSnapshot(['DB_URL', 'API_KEY']);
    const filePath = path.join(tmpDir, '.envlock-snapshot.json');
    writeSnapshot(snap, filePath);
    const loaded = readSnapshot(filePath);
    expect(loaded).toEqual(snap);
  });

  it('throws when snapshot file is missing', () => {
    expect(() => readSnapshot(path.join(tmpDir, 'missing.json'))).toThrow(
      'Snapshot file not found'
    );
  });
});

describe('diffSnapshot', () => {
  const base = createSnapshot(['A', 'B', 'C']);

  it('returns match=true when keys are identical', () => {
    const result = diffSnapshot(['A', 'B', 'C'], base);
    expect(result.match).toBe(true);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('detects added keys', () => {
    const result = diffSnapshot(['A', 'B', 'C', 'D'], base);
    expect(result.match).toBe(false);
    expect(result.added).toContain('D');
  });

  it('detects removed keys', () => {
    const result = diffSnapshot(['A', 'B'], base);
    expect(result.match).toBe(false);
    expect(result.removed).toContain('C');
  });
});

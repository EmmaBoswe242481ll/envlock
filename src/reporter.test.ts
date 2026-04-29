import { generateReport, formatTextReport, formatJsonReport } from './reporter';
import { DiffResult } from './snapshot';

const cleanDiff: DiffResult = {
  added: [],
  removed: [],
  checksumMatch: true,
};

const changedDiff: DiffResult = {
  added: ['NEW_VAR', 'ANOTHER_VAR'],
  removed: ['OLD_VAR'],
  checksumMatch: false,
};

describe('formatTextReport', () => {
  it('reports no changes when diff is clean', () => {
    const report = formatTextReport(cleanDiff, false);
    expect(report).toContain('No changes detected');
    expect(report).toContain('in sync');
  });

  it('reports added variables', () => {
    const report = formatTextReport(changedDiff, false);
    expect(report).toContain('+ NEW_VAR');
    expect(report).toContain('+ ANOTHER_VAR');
  });

  it('reports removed variables', () => {
    const report = formatTextReport(changedDiff, false);
    expect(report).toContain('- OLD_VAR');
  });

  it('reports checksum mismatch', () => {
    const report = formatTextReport(changedDiff, false);
    expect(report).toContain('Checksum mismatch');
  });

  it('includes summary with total changes', () => {
    const report = formatTextReport(changedDiff, false);
    expect(report).toContain('3 change(s)');
  });
});

describe('formatJsonReport', () => {
  it('returns valid JSON', () => {
    const report = formatJsonReport(changedDiff);
    expect(() => JSON.parse(report)).not.toThrow();
  });

  it('includes all diff fields', () => {
    const parsed = JSON.parse(formatJsonReport(changedDiff));
    expect(parsed.added).toEqual(['NEW_VAR', 'ANOTHER_VAR']);
    expect(parsed.removed).toEqual(['OLD_VAR']);
    expect(parsed.checksumMatch).toBe(false);
    expect(parsed.totalChanges).toBe(3);
  });

  it('reports zero changes for clean diff', () => {
    const parsed = JSON.parse(formatJsonReport(cleanDiff));
    expect(parsed.totalChanges).toBe(0);
    expect(parsed.checksumMatch).toBe(true);
  });
});

describe('generateReport', () => {
  it('defaults to text format', () => {
    const report = generateReport(cleanDiff, { color: false });
    expect(report).toContain('envlock diff report');
  });

  it('uses json format when specified', () => {
    const report = generateReport(changedDiff, { format: 'json' });
    const parsed = JSON.parse(report);
    expect(parsed).toHaveProperty('added');
  });
});

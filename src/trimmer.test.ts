import { describe, it, expect } from 'vitest';
import {
  trimValue,
  trimEnvRecord,
  trimEnvContent,
  formatTrimResult,
} from './trimmer';

describe('trimValue', () => {
  it('trims leading and trailing whitespace', () => {
    expect(trimValue('  hello  ')).toBe('hello');
  });

  it('collapses internal whitespace', () => {
    expect(trimValue('foo   bar')).toBe('foo bar');
  });

  it('returns unchanged string when already trimmed', () => {
    expect(trimValue('clean')).toBe('clean');
  });
});

describe('trimEnvRecord', () => {
  it('reports changed and unchanged keys', () => {
    const record = { KEY1: '  value  ', KEY2: 'clean', KEY3: 'a  b' };
    const summary = trimEnvRecord(record);
    expect(summary.total).toBe(3);
    expect(summary.changed).toBe(2);
  });

  it('correctly trims values in results', () => {
    const summary = trimEnvRecord({ FOO: '  bar  ' });
    expect(summary.results[0].trimmed).toBe('bar');
    expect(summary.results[0].changed).toBe(true);
  });

  it('marks unchanged values correctly', () => {
    const summary = trimEnvRecord({ BAZ: 'already' });
    expect(summary.results[0].changed).toBe(false);
  });
});

describe('trimEnvContent', () => {
  it('trims values in env file content', () => {
    const input = 'FOO=  bar  \nBAZ=clean';
    const result = trimEnvContent(input);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=clean');
  });

  it('preserves comment lines', () => {
    const input = '# comment\nKEY=  value  ';
    const result = trimEnvContent(input);
    expect(result).toContain('# comment');
    expect(result).toContain('KEY=value');
  });

  it('preserves blank lines', () => {
    const input = 'A=1\n\nB=2';
    const result = trimEnvContent(input);
    expect(result).toContain('\n\n');
  });
});

describe('formatTrimResult', () => {
  it('shows success message when nothing changed', () => {
    const summary = trimEnvRecord({ KEY: 'value' });
    expect(formatTrimResult(summary)).toMatch(/No trimming needed/);
  });

  it('lists changed keys', () => {
    const summary = trimEnvRecord({ KEY: '  spaced  ' });
    const output = formatTrimResult(summary);
    expect(output).toContain('KEY');
    expect(output).toContain('spaced');
  });
});

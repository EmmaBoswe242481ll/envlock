import { describe, it, expect } from 'vitest';
import {
  inferType,
  castValue,
  typecastRecord,
  formatTypecastReport,
  CastRule,
} from './typecast';

describe('inferType', () => {
  it('infers boolean for true/false strings', () => {
    expect(inferType('true')).toBe('boolean');
    expect(inferType('false')).toBe('boolean');
  });

  it('infers number for numeric strings', () => {
    expect(inferType('42')).toBe('number');
    expect(inferType('3.14')).toBe('number');
  });

  it('infers json for JSON strings', () => {
    expect(inferType('{"a":1}')).toBe('json');
    expect(inferType('[1,2,3]')).toBe('json');
  });

  it('infers string for plain text', () => {
    expect(inferType('hello')).toBe('string');
    expect(inferType('')).toBe('string');
  });
});

describe('castValue', () => {
  it('casts to boolean', () => {
    expect(castValue('true', 'boolean')).toEqual({ casted: true });
    expect(castValue('false', 'boolean')).toEqual({ casted: false });
    expect(castValue('yes', 'boolean').error).toBeDefined();
  });

  it('casts to number', () => {
    expect(castValue('99', 'number')).toEqual({ casted: 99 });
    expect(castValue('abc', 'number').error).toBeDefined();
  });

  it('casts to json', () => {
    expect(castValue('{"x":1}', 'json')).toEqual({ casted: { x: 1 } });
    expect(castValue('not-json', 'json').error).toBeDefined();
  });

  it('casts to string', () => {
    expect(castValue('hello', 'string')).toEqual({ casted: 'hello' });
  });
});

describe('typecastRecord', () => {
  it('auto-infers types when no rules given', () => {
    const record = { PORT: '3000', DEBUG: 'true', NAME: 'app' };
    const { result } = typecastRecord(record);
    expect(result.PORT).toBe(3000);
    expect(result.DEBUG).toBe(true);
    expect(result.NAME).toBe('app');
  });

  it('applies explicit cast rules', () => {
    const record = { TIMEOUT: '30' };
    const rules: CastRule[] = [{ key: 'TIMEOUT', type: 'string' }];
    const { result } = typecastRecord(record, rules);
    expect(result.TIMEOUT).toBe('30');
  });

  it('falls back to original on cast error', () => {
    const record = { LEVEL: 'info' };
    const rules: CastRule[] = [{ key: 'LEVEL', type: 'number' }];
    const { result, report } = typecastRecord(record, rules);
    expect(result.LEVEL).toBe('info');
    expect(report[0].error).toBeDefined();
  });
});

describe('formatTypecastReport', () => {
  it('formats report lines correctly', () => {
    const record = { PORT: '8080', VERBOSE: 'true' };
    const { report } = typecastRecord(record);
    const output = formatTypecastReport(report);
    expect(output).toContain('PORT');
    expect(output).toContain('VERBOSE');
    expect(output).toContain('Typecast Report');
  });
});

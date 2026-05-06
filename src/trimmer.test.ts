import { trimValue, trimEnvRecord, trimEnvContent, formatTrimResult } from './trimmer';

describe('trimValue', () => {
  it('trims leading and trailing spaces', () => {
    expect(trimValue('  hello  ')).toBe('hello');
  });

  it('trims tabs', () => {
    expect(trimValue('\tvalue\t')).toBe('value');
  });

  it('returns unchanged value when no whitespace', () => {
    expect(trimValue('clean')).toBe('clean');
  });

  it('handles empty string', () => {
    expect(trimValue('')).toBe('');
  });
});

describe('trimEnvRecord', () => {
  it('trims all values in a record', () => {
    const result = trimEnvRecord({ NAME: '  Alice  ', PORT: ' 3000 ' });
    expect(result).toEqual({ NAME: 'Alice', PORT: '3000' });
  });

  it('preserves keys with no extra whitespace', () => {
    const result = trimEnvRecord({ KEY: 'value' });
    expect(result).toEqual({ KEY: 'value' });
  });

  it('handles empty record', () => {
    expect(trimEnvRecord({})).toEqual({});
  });
});

describe('trimEnvContent', () => {
  it('trims values in env content', () => {
    const content = 'NAME=  Alice  \nPORT= 3000 \n';
    const result = trimEnvContent(content);
    expect(result).toContain('NAME=Alice');
    expect(result).toContain('PORT=3000');
  });

  it('preserves comments and blank lines', () => {
    const content = '# comment\n\nKEY=  val  \n';
    const result = trimEnvContent(content);
    expect(result).toContain('# comment');
    expect(result).toContain('KEY=val');
  });

  it('handles empty content', () => {
    expect(trimEnvContent('')).toBe('');
  });
});

describe('formatTrimResult', () => {
  it('reports trimmed keys', () => {
    const original = { NAME: '  Alice  ', PORT: '3000' };
    const trimmed = { NAME: 'Alice', PORT: '3000' };
    const result = formatTrimResult(original, trimmed);
    expect(result).toContain('NAME');
    expect(result).not.toContain('PORT');
  });

  it('reports no changes when nothing trimmed', () => {
    const record = { KEY: 'value' };
    const result = formatTrimResult(record, record);
    expect(result).toContain('No values required trimming');
  });
});

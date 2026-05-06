import { describe, it, expect } from 'vitest';
import { lintEnvContent, formatLintResult } from './linter';

describe('lintEnvContent', () => {
  it('returns no issues for a clean file', () => {
    const result = lintEnvContent('APP_NAME=myapp\nPORT=3000\nDEBUG=false');
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('detects missing = separator', () => {
    const result = lintEnvContent('BADLINE');
    expect(result.valid).toBe(false);
    expect(result.issues[0].severity).toBe('error');
    expect(result.issues[0].message).toMatch(/Missing '='/);
  });

  it('detects invalid key names', () => {
    const result = lintEnvContent('123BAD=value');
    expect(result.valid).toBe(false);
    const err = result.issues.find(i => i.message.includes('Invalid key name'));
    expect(err).toBeDefined();
  });

  it('detects duplicate keys', () => {
    const result = lintEnvContent('FOO=a\nFOO=b');
    const dup = result.issues.find(i => i.message.includes('Duplicate'));
    expect(dup).toBeDefined();
    expect(dup?.severity).toBe('warning');
  });

  it('flags empty values as info', () => {
    const result = lintEnvContent('EMPTY=');
    const info = result.issues.find(i => i.severity === 'info');
    expect(info?.message).toMatch(/Empty value/);
  });

  it('warns about short sensitive key values', () => {
    const result = lintEnvContent('DB_PASSWORD=abc');
    const warn = result.issues.find(i => i.severity === 'warning' && i.message.includes('short'));
    expect(warn).toBeDefined();
  });

  it('ignores comments and blank lines', () => {
    const result = lintEnvContent('# comment\n\nAPP=ok');
    expect(result.issues).toHaveLength(0);
  });
});

describe('formatLintResult', () => {
  it('shows success message when no issues', () => {
    const result = lintEnvContent('A=1', '.env');
    expect(formatLintResult(result)).toContain('no issues found');
  });

  it('includes severity, line, and message in output', () => {
    const result = lintEnvContent('BADLINE', '.env');
    const output = formatLintResult(result);
    expect(output).toContain('ERROR');
    expect(output).toContain('line 1');
    expect(output).toContain("Missing '='");
  });
});

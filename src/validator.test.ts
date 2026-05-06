import { describe, it, expect } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { validateRecord, validateEnvFile, formatValidationResult, ValidationRule } from './validator';

function writeTempEnv(content: string): string {
  const p = join(tmpdir(), `validator-test-${Date.now()}.env`);
  writeFileSync(p, content, 'utf-8');
  return p;
}

const rules: ValidationRule[] = [
  { key: 'PORT', required: true, pattern: /^\d+$/ },
  { key: 'NODE_ENV', required: true, allowedValues: ['development', 'production', 'test'] },
  { key: 'SECRET', required: false, minLength: 8, maxLength: 64 },
];

describe('validateRecord', () => {
  it('passes when all rules are satisfied', () => {
    const result = validateRecord({ PORT: '3000', NODE_ENV: 'production', SECRET: 'supersecret' }, rules);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('reports missing required key as error', () => {
    const result = validateRecord({ NODE_ENV: 'production' }, rules);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.key === 'PORT' && i.severity === 'error')).toBe(true);
  });

  it('reports pattern mismatch as error', () => {
    const result = validateRecord({ PORT: 'abc', NODE_ENV: 'test' }, rules);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.key === 'PORT')).toBe(true);
  });

  it('reports invalid allowedValues as error', () => {
    const result = validateRecord({ PORT: '8080', NODE_ENV: 'staging' }, rules);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.key === 'NODE_ENV')).toBe(true);
  });

  it('reports minLength violation as warning', () => {
    const result = validateRecord({ PORT: '3000', NODE_ENV: 'test', SECRET: 'short' }, rules);
    expect(result.valid).toBe(true);
    expect(result.issues.some(i => i.key === 'SECRET' && i.severity === 'warning')).toBe(true);
  });

  it('skips optional missing keys', () => {
    const result = validateRecord({ PORT: '3000', NODE_ENV: 'development' }, rules);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});

describe('validateEnvFile', () => {
  it('validates a file correctly', () => {
    const p = writeTempEnv('PORT=3000\nNODE_ENV=test\n');
    const result = validateEnvFile(p, rules);
    expect(result.valid).toBe(true);
    unlinkSync(p);
  });
});

describe('formatValidationResult', () => {
  it('shows success message when no issues', () => {
    const out = formatValidationResult({ valid: true, issues: [] });
    expect(out).toContain('passed');
  });

  it('shows failure message with issues', () => {
    const out = formatValidationResult({
      valid: false,
      issues: [{ key: 'PORT', message: 'Required variable is missing or empty', severity: 'error' }],
    });
    expect(out).toContain('ERROR');
    expect(out).toContain('PORT');
  });
});

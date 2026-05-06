import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { parseValidatorArgs, loadRules } from './validatorCli';

function writeTempFile(name: string, content: string): string {
  const p = join(tmpdir(), `${name}-${Date.now()}`);
  writeFileSync(p, content, 'utf-8');
  return p;
}

describe('parseValidatorArgs', () => {
  it('returns defaults when no args provided', () => {
    const result = parseValidatorArgs(['node', 'validatorCli.ts']);
    expect(result.envFile).toBe('.env');
    expect(result.rulesFile).toBe('.env.rules.json');
    expect(result.json).toBe(false);
  });

  it('parses --env flag', () => {
    const result = parseValidatorArgs(['node', 'cli', '--env', '.env.prod']);
    expect(result.envFile).toBe('.env.prod');
  });

  it('parses --rules flag', () => {
    const result = parseValidatorArgs(['node', 'cli', '--rules', 'rules.json']);
    expect(result.rulesFile).toBe('rules.json');
  });

  it('parses --json flag', () => {
    const result = parseValidatorArgs(['node', 'cli', '--json']);
    expect(result.json).toBe(true);
  });
});

describe('loadRules', () => {
  it('loads and parses rules from JSON file', () => {
    const p = writeTempFile('rules.json', JSON.stringify([
      { key: 'PORT', required: true, pattern: '^\\d+$' },
      { key: 'NODE_ENV', required: true, allowedValues: ['development', 'production'] },
    ]));
    const rules = loadRules(p);
    expect(rules).toHaveLength(2);
    expect(rules[0].key).toBe('PORT');
    expect(rules[0].pattern).toBeInstanceOf(RegExp);
    expect(rules[1].allowedValues).toContain('production');
    unlinkSync(p);
  });

  it('throws if rules file is not an array', () => {
    const p = writeTempFile('bad-rules.json', JSON.stringify({ key: 'PORT' }));
    expect(() => loadRules(p)).toThrow('JSON array');
    unlinkSync(p);
  });

  it('handles rules without pattern', () => {
    const p = writeTempFile('rules-nopat.json', JSON.stringify([
      { key: 'API_URL', required: true },
    ]));
    const rules = loadRules(p);
    expect(rules[0].pattern).toBeUndefined();
    unlinkSync(p);
  });
});

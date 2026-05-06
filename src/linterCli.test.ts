import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseLintArgs, runLinter } from './linterCli';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `envlock-lint-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseLintArgs', () => {
  it('defaults to .env when no files given', () => {
    const args = parseLintArgs(['node', 'linterCli.js']);
    expect(args.files).toEqual(['.env']);
    expect(args.json).toBe(false);
  });

  it('parses --json flag', () => {
    const args = parseLintArgs(['node', 'linterCli.js', '--json', 'a.env']);
    expect(args.json).toBe(true);
    expect(args.files).toEqual(['a.env']);
  });

  it('parses multiple files', () => {
    const args = parseLintArgs(['node', 'linterCli.js', 'a.env', 'b.env']);
    expect(args.files).toEqual(['a.env', 'b.env']);
  });
});

describe('runLinter', () => {
  let logs: string[];
  let origLog: typeof console.log;
  let origErr: typeof console.error;

  beforeEach(() => {
    logs = [];
    origLog = console.log;
    origErr = console.error;
    console.log = (...a) => logs.push(a.join(' '));
    console.error = (...a) => logs.push(a.join(' '));
    process.exitCode = 0;
  });

  afterEach(() => {
    console.log = origLog;
    console.error = origErr;
  });

  it('reports clean file', () => {
    const f = writeTempEnv('APP=ok\nPORT=3000');
    runLinter(['node', 'cli', f]);
    expect(logs.join('\n')).toContain('no issues found');
    expect(process.exitCode).toBe(0);
    fs.unlinkSync(f);
  });

  it('sets exitCode=1 for errors', () => {
    const f = writeTempEnv('BADLINE');
    runLinter(['node', 'cli', f]);
    expect(process.exitCode).toBe(1);
    fs.unlinkSync(f);
  });

  it('outputs JSON when --json flag set', () => {
    const f = writeTempEnv('A=1');
    runLinter(['node', 'cli', '--json', f]);
    const output = logs.join('\n');
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    fs.unlinkSync(f);
  });

  it('errors when file not found', () => {
    runLinter(['node', 'cli', '/nonexistent/.env']);
    expect(logs.join('\n')).toContain('File not found');
    expect(process.exitCode).toBe(1);
  });
});

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseTrimArgs, runTrimmer } from './trimmerCli';

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `trimmer-cli-${Date.now()}.env`);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('parseTrimArgs', () => {
  it('parses --file flag', () => {
    const args = parseTrimArgs(['--file', '.env.test']);
    expect(args.file).toBe('.env.test');
  });

  it('parses --dry-run flag', () => {
    const args = parseTrimArgs(['--dry-run']);
    expect(args.dryRun).toBe(true);
  });

  it('parses --output flag', () => {
    const args = parseTrimArgs(['--output', '.env.out']);
    expect(args.output).toBe('.env.out');
  });

  it('parses --json flag', () => {
    const args = parseTrimArgs(['--json']);
    expect(args.json).toBe(true);
  });

  it('defaults to .env with no flags', () => {
    const args = parseTrimArgs([]);
    expect(args.file).toBe('.env');
    expect(args.dryRun).toBe(false);
  });
});

describe('runTrimmer', () => {
  it('trims values and writes to file', () => {
    const file = writeTempEnv('NAME=  Alice  \nPORT= 3000 \n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runTrimmer(['--file', file]);
    const result = fs.readFileSync(file, 'utf-8');
    expect(result).toContain('NAME=Alice');
    expect(result).toContain('PORT=3000');
    spy.mockRestore();
    fs.unlinkSync(file);
  });

  it('does not write in dry-run mode', () => {
    const file = writeTempEnv('KEY=  value  \n');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    runTrimmer(['--file', file, '--dry-run']);
    const result = fs.readFileSync(file, 'utf-8');
    expect(result).toBe('KEY=  value  \n');
    spy.mockRestore();
    fs.unlinkSync(file);
  });

  it('outputs json when --json flag is set', () => {
    const file = writeTempEnv('FOO=  bar  \n');
    const logs: string[] = [];
    const spy = jest.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
    runTrimmer(['--file', file, '--json', '--dry-run']);
    const parsed = JSON.parse(logs[0]);
    expect(parsed.changed).toHaveProperty('FOO');
    expect(parsed.changed.FOO.before).toBe('  bar  ');
    expect(parsed.changed.FOO.after).toBe('bar');
    spy.mockRestore();
    fs.unlinkSync(file);
  });

  it('exits with error when file not found', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => runTrimmer(['--file', '/nonexistent/.env'])).toThrow('exit');
    spy.mockRestore();
    exit.mockRestore();
  });
});

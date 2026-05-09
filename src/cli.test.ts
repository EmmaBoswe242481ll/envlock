import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const TMP_DIR = path.join(__dirname, '__cli_tmp__');
const CLI_PATH = path.join(__dirname, 'cli.ts');

function write(file: string, content: string) {
  fs.writeFileSync(path.join(TMP_DIR, file), content, 'utf-8');
}

/**
 * Runs the CLI with the given arguments in the temporary test directory.
 * Returns stdout, stderr, and the process exit code.
 */
function runCli(args: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(`npx ts-node ${CLI_PATH} ${args}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });
    return { stdout, stderr: '', code: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      code: err.status ?? 1,
    };
  }
}

/**
 * Returns true if the given file exists in the temporary test directory.
 */
function tmpFileExists(file: string): boolean {
  return fs.existsSync(path.join(TMP_DIR, file));
}

beforeAll(() => {
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
});

afterAll(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('cli validate command', () => {
  it('exits 0 when all required keys are present', () => {
    write('.env', 'API_KEY=abc\nDB_URL=postgres://localhost/db\n');
    write('.env.schema', 'API_KEY\nDB_URL\n');
    const result = runCli(`validate --env .env --schema .env.schema`);
    expect(result.code).toBe(0);
  });

  it('exits 1 when required keys are missing', () => {
    write('.env', 'API_KEY=abc\n');
    write('.env.schema', 'API_KEY\nDB_URL\n');
    const result = runCli(`validate --env .env --schema .env.schema`);
    expect(result.code).toBe(1);
  });

  it('outputs json report when --format json is passed', () => {
    write('.env', 'API_KEY=abc\nDB_URL=postgres://localhost/db\n');
    write('.env.schema', 'API_KEY\nDB_URL\n');
    const result = runCli(`validate --env .env --schema .env.schema --format json`);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
  });
});

describe('cli snapshot command', () => {
  it('writes a snapshot file', () => {
    write('.env', 'API_KEY=abc\nDB_URL=postgres://localhost/db\n');
    runCli(`snapshot --env .env --snapshot .env.snapshot`);
    expect(tmpFileExists('.env.snapshot')).toBe(true);
  });
});

describe('cli diff command', () => {
  it('exits 0 when env matches snapshot', () => {
    write('.env', 'API_KEY=abc\nDB_URL=postgres://localhost/db\n');
    runCli(`snapshot --env .env --snapshot .env.snapshot`);
    const result = runCli(`diff --env .env --snapshot .env.snapshot`);
    expect(result.code).toBe(0);
  });

  it('exits 1 when env differs from snapshot', () => {
    write('.env', 'API_KEY=abc\nDB_URL=postgres://localhost/db\n');
    runCli(`snapshot --env .env --snapshot .env.snapshot`);
    write('.env', 'API_KEY=abc\nDB_URL=postgres://localhost/db\nNEW_KEY=xyz\n');
    const result = runCli(`diff --env .env --snapshot .env.snapshot`);
    expect(result.code).toBe(1);
  });
});

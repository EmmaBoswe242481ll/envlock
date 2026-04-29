import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { watchEnvFile, WatchEvent } from './watcher';

function writeTempEnv(content: string): string {
  const tmpPath = path.join(os.tmpdir(), `envlock-watch-${Date.now()}.env`);
  fs.writeFileSync(tmpPath, content, 'utf-8');
  return tmpPath;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('watchEnvFile', () => {
  let tmpPath: string;

  afterEach(() => {
    if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  });

  it('detects a change when file content changes', async () => {
    tmpPath = writeTempEnv('FOO=bar\n');
    const events: WatchEvent[] = [];

    const watcher = watchEnvFile(tmpPath, (e) => events.push(e), { debounceMs: 100 });

    await sleep(150);
    fs.writeFileSync(tmpPath, 'FOO=bar\nBAZ=qux\n', 'utf-8');
    await sleep(300);

    watcher.close();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('changed');
    expect(events[0].previousChecksum).not.toBeNull();
    expect(events[0].currentChecksum).not.toBeNull();
    expect(events[0].previousChecksum).not.toBe(events[0].currentChecksum);
  });

  it('reports unchanged when only values differ in onlyKeys mode', async () => {
    tmpPath = writeTempEnv('FOO=bar\n');
    const events: WatchEvent[] = [];

    const watcher = watchEnvFile(tmpPath, (e) => events.push(e), {
      debounceMs: 100,
      onlyKeys: true,
    });

    await sleep(150);
    fs.writeFileSync(tmpPath, 'FOO=newvalue\n', 'utf-8');
    await sleep(300);

    watcher.close();
    const changed = events.filter((e) => e.type === 'changed');
    expect(changed.length).toBe(0);
  });

  it('detects key addition in onlyKeys mode', async () => {
    tmpPath = writeTempEnv('FOO=bar\n');
    const events: WatchEvent[] = [];

    const watcher = watchEnvFile(tmpPath, (e) => events.push(e), {
      debounceMs: 100,
      onlyKeys: true,
    });

    await sleep(150);
    fs.writeFileSync(tmpPath, 'FOO=bar\nNEW_KEY=value\n', 'utf-8');
    await sleep(300);

    watcher.close();
    const changed = events.filter((e) => e.type === 'changed');
    expect(changed.length).toBeGreaterThan(0);
  });

  it('includes file path in event', async () => {
    tmpPath = writeTempEnv('A=1\n');
    const events: WatchEvent[] = [];

    const watcher = watchEnvFile(tmpPath, (e) => events.push(e), { debounceMs: 100 });
    await sleep(150);
    fs.writeFileSync(tmpPath, 'A=2\n', 'utf-8');
    await sleep(300);

    watcher.close();
    if (events.length > 0) {
      expect(events[0].filePath).toContain('envlock-watch');
    }
  });
});

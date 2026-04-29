import * as path from 'path';
import { watchEnvFile, WatchEvent } from './watcher';
import { colorize } from './reporter';

export interface WatchCliArgs {
  filePath: string;
  onlyKeys: boolean;
  debounceMs: number;
}

export function parseWatchArgs(argv: string[]): WatchCliArgs {
  const args = argv.slice(2);
  const filePath = args.find((a) => !a.startsWith('--')) ?? '.env';
  const onlyKeys = args.includes('--only-keys');
  const debounceFlag = args.find((a) => a.startsWith('--debounce='));
  const debounceMs = debounceFlag ? parseInt(debounceFlag.split('=')[1], 10) : 300;
  return { filePath, onlyKeys, debounceMs };
}

function handleEvent(event: WatchEvent): void {
  const timestamp = new Date().toISOString();
  if (event.type === 'changed') {
    console.log(
      colorize('yellow', `[${timestamp}] ⚠  ${event.message}`)
    );
    console.log(`  Previous checksum: ${event.previousChecksum ?? 'none'}`);
    console.log(`  Current checksum:  ${event.currentChecksum ?? 'none'}`);
  } else if (event.type === 'error') {
    console.error(colorize('red', `[${timestamp}] ✖  ${event.message}`));
  }
}

export function runWatcher(argv: string[] = process.argv): void {
  const { filePath, onlyKeys, debounceMs } = parseWatchArgs(argv);
  const resolved = path.resolve(filePath);

  console.log(colorize('cyan', `Watching ${resolved} for changes...`));
  if (onlyKeys) console.log(colorize('cyan', 'Mode: keys only (value changes ignored)'));

  const watcher = watchEnvFile(resolved, handleEvent, { onlyKeys, debounceMs });

  process.on('SIGINT', () => {
    watcher.close();
    console.log(colorize('cyan', '\nWatcher stopped.'));
    process.exit(0);
  });
}

if (require.main === module) {
  runWatcher();
}

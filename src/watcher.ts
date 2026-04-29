import * as fs from 'fs';
import * as path from 'path';
import { generateChecksum } from './snapshot';
import { parseEnvContent } from './loader';

export interface WatchEvent {
  type: 'changed' | 'unchanged' | 'error';
  filePath: string;
  previousChecksum: string | null;
  currentChecksum: string | null;
  message: string;
}

export type WatchCallback = (event: WatchEvent) => void;

export interface WatcherOptions {
  debounceMs?: number;
  onlyKeys?: boolean;
}

export function watchEnvFile(
  filePath: string,
  callback: WatchCallback,
  options: WatcherOptions = {}
): fs.FSWatcher {
  const { debounceMs = 300, onlyKeys = false } = options;
  const absolutePath = path.resolve(filePath);
  let previousChecksum: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  try {
    const initialContent = fs.readFileSync(absolutePath, 'utf-8');
    const data = onlyKeys
      ? Object.keys(parseEnvContent(initialContent)).join('\n')
      : initialContent;
    previousChecksum = generateChecksum(data);
  } catch {
    previousChecksum = null;
  }

  const watcher = fs.watch(absolutePath, (eventType) => {
    if (eventType !== 'change') return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        const content = fs.readFileSync(absolutePath, 'utf-8');
        const data = onlyKeys
          ? Object.keys(parseEnvContent(content)).join('\n')
          : content;
        const currentChecksum = generateChecksum(data);

        if (currentChecksum !== previousChecksum) {
          callback({
            type: 'changed',
            filePath: absolutePath,
            previousChecksum,
            currentChecksum,
            message: `Detected changes in ${filePath}`,
          });
          previousChecksum = currentChecksum;
        } else {
          callback({
            type: 'unchanged',
            filePath: absolutePath,
            previousChecksum,
            currentChecksum,
            message: `No effective changes in ${filePath}`,
          });
        }
      } catch (err) {
        callback({
          type: 'error',
          filePath: absolutePath,
          previousChecksum,
          currentChecksum: null,
          message: `Error reading ${filePath}: ${(err as Error).message}`,
        });
      }
    }, debounceMs);
  });

  return watcher;
}

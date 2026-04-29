import { DiffResult } from './snapshot';

export type ReportFormat = 'text' | 'json';

export interface ReportOptions {
  format?: ReportFormat;
  color?: boolean;
}

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

function colorize(text: string, code: string, useColor: boolean): string {
  return useColor ? `${code}${text}${RESET}` : text;
}

export function formatTextReport(diff: DiffResult, useColor = true): string {
  const lines: string[] = [];

  lines.push(colorize('=== envlock diff report ===', BOLD, useColor));

  if (diff.added.length === 0 && diff.removed.length === 0 && diff.checksumMatch) {
    lines.push(colorize('✔ No changes detected. Environment is in sync.', GREEN, useColor));
    return lines.join('\n');
  }

  if (!diff.checksumMatch) {
    lines.push(colorize('✘ Checksum mismatch detected.', RED, useColor));
  }

  if (diff.added.length > 0) {
    lines.push(colorize(`\n+ Added variables (${diff.added.length}):`, GREEN, useColor));
    diff.added.forEach((key) => {
      lines.push(colorize(`  + ${key}`, GREEN, useColor));
    });
  }

  if (diff.removed.length > 0) {
    lines.push(colorize(`\n- Removed variables (${diff.removed.length}):`, RED, useColor));
    diff.removed.forEach((key) => {
      lines.push(colorize(`  - ${key}`, RED, useColor));
    });
  }

  const totalChanges = diff.added.length + diff.removed.length;
  lines.push(
    colorize(`\nSummary: ${totalChanges} change(s) found.`, YELLOW, useColor)
  );

  return lines.join('\n');
}

export function formatJsonReport(diff: DiffResult): string {
  return JSON.stringify(
    {
      checksumMatch: diff.checksumMatch,
      added: diff.added,
      removed: diff.removed,
      totalChanges: diff.added.length + diff.removed.length,
    },
    null,
    2
  );
}

export function generateReport(diff: DiffResult, options: ReportOptions = {}): string {
  const { format = 'text', color = true } = options;

  if (format === 'json') {
    return formatJsonReport(diff);
  }

  return formatTextReport(diff, color);
}

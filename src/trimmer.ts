/**
 * trimmer.ts
 * Trims whitespace and normalizes spacing in .env file values.
 */

export interface TrimResult {
  key: string;
  original: string;
  trimmed: string;
  changed: boolean;
}

export interface TrimSummary {
  total: number;
  changed: number;
  results: TrimResult[];
}

/**
 * Trim a single value: strip surrounding whitespace and collapse internal spaces.
 */
export function trimValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Process a record of env key/value pairs and trim all values.
 */
export function trimEnvRecord(record: Record<string, string>): TrimSummary {
  const results: TrimResult[] = [];

  for (const [key, original] of Object.entries(record)) {
    const trimmed = trimValue(original);
    results.push({ key, original, trimmed, changed: trimmed !== original });
  }

  return {
    total: results.length,
    changed: results.filter((r) => r.changed).length,
    results,
  };
}

/**
 * Apply trimming to raw .env file content line by line.
 */
export function trimEnvContent(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      const stripped = line.trim();
      if (!stripped || stripped.startsWith('#')) return line;
      const eqIndex = stripped.indexOf('=');
      if (eqIndex === -1) return line;
      const key = stripped.slice(0, eqIndex).trim();
      const value = stripped.slice(eqIndex + 1).trim();
      return `${key}=${value}`;
    })
    .join('\n');
}

/**
 * Format a human-readable trim report.
 */
export function formatTrimResult(summary: TrimSummary): string {
  if (summary.changed === 0) {
    return `✔ No trimming needed (${summary.total} keys checked).`;
  }
  const lines = [`Trimmed ${summary.changed} of ${summary.total} values:\n`];
  for (const r of summary.results.filter((r) => r.changed)) {
    lines.push(`  ${r.key}: "${r.original}" → "${r.trimmed}"`);
  }
  return lines.join('\n');
}

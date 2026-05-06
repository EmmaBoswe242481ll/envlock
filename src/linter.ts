/**
 * linter.ts — Lint .env files for common issues:
 * duplicate keys, empty values, invalid key names, and suspicious patterns.
 */

export interface LintIssue {
  line: number;
  key?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface LintResult {
  file: string;
  issues: LintIssue[];
  valid: boolean;
}

const VALID_KEY_RE = /^[A-Z_][A-Z0-9_]*$/i;

export function lintEnvContent(content: string, filePath = '<input>'): LintResult {
  const lines = content.split('\n');
  const issues: LintIssue[] = [];
  const seenKeys = new Map<string, number>();

  lines.forEach((raw, idx) => {
    const lineNum = idx + 1;
    const trimmed = raw.trim();

    if (trimmed === '' || trimmed.startsWith('#')) return;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      issues.push({ line: lineNum, severity: 'error', message: `Missing '=' separator` });
      return;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();

    if (!VALID_KEY_RE.test(key)) {
      issues.push({ line: lineNum, key, severity: 'error', message: `Invalid key name: '${key}'` });
    }

    if (seenKeys.has(key)) {
      issues.push({
        line: lineNum,
        key,
        severity: 'warning',
        message: `Duplicate key '${key}' (first seen on line ${seenKeys.get(key)})`,
      });
    } else {
      seenKeys.set(key, lineNum);
    }

    if (value === '') {
      issues.push({ line: lineNum, key, severity: 'info', message: `Empty value for key '${key}'` });
    }

    if (/password|secret|token/i.test(key) && value.length < 8 && value !== '') {
      issues.push({
        line: lineNum,
        key,
        severity: 'warning',
        message: `Sensitive key '${key}' has a suspiciously short value`,
      });
    }
  });

  return { file: filePath, issues, valid: issues.filter(i => i.severity === 'error').length === 0 };
}

export function formatLintResult(result: LintResult): string {
  if (result.issues.length === 0) return `✔  ${result.file} — no issues found`;
  const lines = [`Lint results for ${result.file}:`];
  for (const issue of result.issues) {
    const tag = issue.severity.toUpperCase().padEnd(7);
    const loc = `line ${issue.line}`;
    lines.push(`  [${tag}] ${loc}: ${issue.message}`);
  }
  return lines.join('\n');
}

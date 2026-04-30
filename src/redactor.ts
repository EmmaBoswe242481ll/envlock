/**
 * redactor.ts
 * Masks sensitive values in .env records before display or export.
 */

export type RedactOptions = {
  mask?: string;
  sensitivePatterns?: RegExp[];
  sensitiveKeys?: string[];
};

const DEFAULT_SENSITIVE_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /private[_-]?key/i,
  /auth/i,
  /credential/i,
  /passphrase/i,
];

const DEFAULT_MASK = "***REDACTED***";

export function isSensitiveKey(
  key: string,
  patterns: RegExp[] = DEFAULT_SENSITIVE_PATTERNS,
  extraKeys: string[] = []
): boolean {
  if (extraKeys.map((k) => k.toLowerCase()).includes(key.toLowerCase())) {
    return true;
  }
  return patterns.some((pattern) => pattern.test(key));
}

export function redactRecord(
  record: Record<string, string>,
  options: RedactOptions = {}
): Record<string, string> {
  const {
    mask = DEFAULT_MASK,
    sensitivePatterns = DEFAULT_SENSITIVE_PATTERNS,
    sensitiveKeys = [],
  } = options;

  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    redacted[key] = isSensitiveKey(key, sensitivePatterns, sensitiveKeys)
      ? mask
      : value;
  }
  return redacted;
}

export function redactEnvContent(
  content: string,
  options: RedactOptions = {}
): string {
  const lines = content.split("\n");
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) return line;
      const key = line.slice(0, eqIndex).trim();
      const value = line.slice(eqIndex + 1);
      if (isSensitiveKey(key, options.sensitivePatterns, options.sensitiveKeys)) {
        return `${key}=${options.mask ?? DEFAULT_MASK}`;
      }
      return `${key}=${value}`;
    })
    .join("\n");
}

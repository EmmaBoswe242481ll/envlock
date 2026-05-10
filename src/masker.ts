/**
 * masker.ts
 * Masks env variable values partially, useful for logging and debugging
 * without exposing full secrets.
 */

export type MaskMode = "full" | "partial" | "length";

export interface MaskOptions {
  mode?: MaskMode;
  visibleChars?: number;
  maskChar?: string;
}

export interface MaskResult {
  original: Record<string, string>;
  masked: Record<string, string>;
  maskedKeys: string[];
}

const DEFAULT_OPTIONS: Required<MaskOptions> = {
  mode: "partial",
  visibleChars: 4,
  maskChar: "*",
};

export function maskValue(value: string, options: MaskOptions = {}): string {
  const { mode, visibleChars, maskChar } = { ...DEFAULT_OPTIONS, ...options };

  if (value.length === 0) return value;

  if (mode === "full") {
    return maskChar.repeat(value.length);
  }

  if (mode === "length") {
    return `${maskChar.repeat(8)} (${value.length} chars)`;
  }

  // partial: show first N chars, mask the rest
  const visible = Math.min(visibleChars, value.length);
  const shown = value.slice(0, visible);
  const hidden = maskChar.repeat(Math.max(value.length - visible, 3));
  return `${shown}${hidden}`;
}

export function maskRecord(
  record: Record<string, string>,
  sensitiveKeys: string[],
  options: MaskOptions = {}
): MaskResult {
  const masked: Record<string, string> = {};
  const maskedKeys: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    const isSensitive = sensitiveKeys.some(
      (k) => k.toLowerCase() === key.toLowerCase()
    );
    if (isSensitive) {
      masked[key] = maskValue(value, options);
      maskedKeys.push(key);
    } else {
      masked[key] = value;
    }
  }

  return { original: record, masked, maskedKeys };
}

export function formatMaskResult(result: MaskResult): string {
  const lines: string[] = [];
  lines.push(`Masked ${result.maskedKeys.length} key(s): ${result.maskedKeys.join(", ") || "none"}`);
  lines.push("");
  for (const [key, value] of Object.entries(result.masked)) {
    lines.push(`${key}=${value}`);
  }
  return lines.join("\n");
}

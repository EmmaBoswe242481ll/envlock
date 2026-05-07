/**
 * duplicator.ts
 * Detects duplicate keys and duplicate values in .env files.
 */

export interface DuplicateResult {
  duplicateKeys: Record<string, number[]>;
  duplicateValues: Record<string, string[]>;
  hasDuplicates: boolean;
}

export function findDuplicateKeys(content: string): Record<string, number[]> {
  const lines = content.split("\n");
  const seen: Record<string, number[]> = {};

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    if (!key) return;
    if (!seen[key]) seen[key] = [];
    seen[key].push(index + 1);
  });

  return Object.fromEntries(
    Object.entries(seen).filter(([, lines]) => lines.length > 1)
  );
}

export function findDuplicateValues(
  record: Record<string, string>
): Record<string, string[]> {
  const valueMap: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(record)) {
    if (!value) continue;
    if (!valueMap[value]) valueMap[value] = [];
    valueMap[value].push(key);
  }

  return Object.fromEntries(
    Object.entries(valueMap).filter(([, keys]) => keys.length > 1)
  );
}

export function detectDuplicates(
  content: string,
  record: Record<string, string>
): DuplicateResult {
  const duplicateKeys = findDuplicateKeys(content);
  const duplicateValues = findDuplicateValues(record);
  const hasDuplicates =
    Object.keys(duplicateKeys).length > 0 ||
    Object.keys(duplicateValues).length > 0;

  return { duplicateKeys, duplicateValues, hasDuplicates };
}

export function formatDuplicateResult(result: DuplicateResult): string {
  const lines: string[] = [];

  if (!result.hasDuplicates) {
    return "No duplicates found.";
  }

  if (Object.keys(result.duplicateKeys).length > 0) {
    lines.push("Duplicate keys:");
    for (const [key, lineNums] of Object.entries(result.duplicateKeys)) {
      lines.push(`  ${key} (lines: ${lineNums.join(", ")})`);
    }
  }

  if (Object.keys(result.duplicateValues).length > 0) {
    lines.push("Duplicate values:");
    for (const [value, keys] of Object.entries(result.duplicateValues)) {
      lines.push(`  "${value}" used by: ${keys.join(", ")}`);
    }
  }

  return lines.join("\n");
}

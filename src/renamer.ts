export interface RenameRule {
  from: string;
  to: string;
}

export interface SkippedRename extends RenameRule {
  reason: string;
}

export interface RenameResult {
  renamed: Record<string, string>;
  applied: RenameRule[];
  skipped: SkippedRename[];
}

export function parseRenameRules(ruleStrings: string[]): Record<string, string> {
  const rules: Record<string, string> = {};
  for (const rule of ruleStrings) {
    const eqIdx = rule.indexOf("=");
    if (eqIdx < 1) continue;
    const from = rule.slice(0, eqIdx).trim();
    const to = rule.slice(eqIdx + 1).trim();
    if (from && to) {
      rules[from] = to;
    }
  }
  return rules;
}

export function applyRenames(
  record: Record<string, string>,
  rules: Record<string, string>
): RenameResult {
  const renamed: Record<string, string> = { ...record };
  const applied: RenameRule[] = [];
  const skipped: SkippedRename[] = [];

  for (const [from, to] of Object.entries(rules)) {
    if (!(from in record)) {
      skipped.push({ from, to, reason: "key not found" });
      continue;
    }
    if (to in renamed && to !== from) {
      skipped.push({ from, to, reason: "target key already exists" });
      continue;
    }
    const value = renamed[from];
    delete renamed[from];
    renamed[to] = value;
    applied.push({ from, to });
  }

  return { renamed, applied, skipped };
}

export function formatRenameResult(result: RenameResult): string {
  const lines: string[] = [];

  if (result.applied.length > 0) {
    lines.push(`Renamed (${result.applied.length} rename${result.applied.length !== 1 ? "s" : ""} applied):`);
    for (const { from, to } of result.applied) {
      lines.push(`  ${from} → ${to}`);
    }
  } else {
    lines.push("No renames applied.");
  }

  if (result.skipped.length > 0) {
    lines.push(`\nSkipped (${result.skipped.length}):`);
    for (const { from, to, reason } of result.skipped) {
      lines.push(`  ${from} → ${to}  [${reason}]`);
    }
  }

  return lines.join("\n");
}

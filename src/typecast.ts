/**
 * typecast.ts
 * Casts env variable string values to their inferred or specified types.
 */

export type CastType = 'string' | 'number' | 'boolean' | 'json';

export interface CastRule {
  key: string;
  type: CastType;
}

export interface CastResult {
  key: string;
  original: string;
  casted: unknown;
  type: CastType;
  error?: string;
}

export function inferType(value: string): CastType {
  if (value === 'true' || value === 'false') return 'boolean';
  if (!isNaN(Number(value)) && value.trim() !== '') return 'number';
  try {
    JSON.parse(value);
    return 'json';
  } catch {
    return 'string';
  }
}

export function castValue(value: string, type: CastType): { casted: unknown; error?: string } {
  try {
    switch (type) {
      case 'boolean':
        if (value === 'true') return { casted: true };
        if (value === 'false') return { casted: false };
        return { casted: undefined, error: `Cannot cast "${value}" to boolean` };
      case 'number': {
        const n = Number(value);
        if (isNaN(n)) return { casted: undefined, error: `Cannot cast "${value}" to number` };
        return { casted: n };
      }
      case 'json':
        return { casted: JSON.parse(value) };
      case 'string':
      default:
        return { casted: value };
    }
  } catch (e) {
    return { casted: undefined, error: (e as Error).message };
  }
}

export function typecastRecord(
  record: Record<string, string>,
  rules: CastRule[] = []
): { result: Record<string, unknown>; report: CastResult[] } {
  const ruleMap = new Map(rules.map((r) => [r.key, r.type]));
  const report: CastResult[] = [];
  const result: Record<string, unknown> = {};

  for (const [key, original] of Object.entries(record)) {
    const type = ruleMap.get(key) ?? inferType(original);
    const { casted, error } = castValue(original, type);
    result[key] = error ? original : casted;
    report.push({ key, original, casted: error ? original : casted, type, ...(error ? { error } : {}) });
  }

  return { result, report };
}

export function formatTypecastReport(report: CastResult[]): string {
  const lines = report.map((r) => {
    const status = r.error ? `ERROR: ${r.error}` : `OK (${r.type})`;
    return `  ${r.key}: "${r.original}" => ${JSON.stringify(r.casted)} [${status}]`;
  });
  return `Typecast Report:\n${lines.join('\n')}`;
}

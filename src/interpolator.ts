/**
 * interpolator.ts
 * Resolves variable references within .env files (e.g., FOO=${BAR}_suffix)
 */

export type EnvRecord = Record<string, string>;

/**
 * Resolve a single value by expanding ${VAR} references.
 * Supports up to 10 levels of recursion to avoid infinite loops.
 */
export function resolveValue(
  value: string,
  env: EnvRecord,
  depth = 0
): string {
  if (depth > 10) return value;

  return value.replace(/\$\{([^}]+)\}/g, (_, key: string) => {
    const resolved = env[key];
    if (resolved === undefined) return "";
    return resolveValue(resolved, env, depth + 1);
  });
}

/**
 * Interpolate all values in an env record, resolving cross-references.
 * Variables are resolved in declaration order.
 */
export function interpolateEnv(raw: EnvRecord): EnvRecord {
  const result: EnvRecord = {};

  for (const [key, value] of Object.entries(raw)) {
    // Merge already-resolved keys so later vars can reference earlier ones
    result[key] = resolveValue(value, { ...raw, ...result });
  }

  return result;
}

/**
 * Detect unresolved variable references in the interpolated record.
 */
export function findUnresolvedRefs(
  interpolated: EnvRecord
): Array<{ key: string; ref: string }> {
  const unresolved: Array<{ key: string; ref: string }> = [];
  const pattern = /\$\{([^}]+)\}/g;

  for (const [key, value] of Object.entries(interpolated)) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value)) !== null) {
      unresolved.push({ key, ref: match[1] });
    }
  }

  return unresolved;
}

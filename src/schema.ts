export type VariableRule = {
  required?: boolean;
  pattern?: RegExp;
  description?: string;
};

export type Schema = Record<string, VariableRule>;

export type ValidationResult = {
  valid: boolean;
  missing: string[];
  invalid: { key: string; reason: string }[];
  warnings: string[];
};

/**
 * Validates a parsed env object against a schema.
 * Returns a structured result with missing keys, pattern failures, and warnings.
 */
export function validateEnv(
  env: Record<string, string | undefined>,
  schema: Schema
): ValidationResult {
  const missing: string[] = [];
  const invalid: { key: string; reason: string }[] = [];
  const warnings: string[] = [];

  for (const [key, rule] of Object.entries(schema)) {
    const value = env[key];

    if (rule.required !== false && (value === undefined || value === "")) {
      missing.push(key);
      continue;
    }

    if (value === undefined || value === "") {
      warnings.push(
        `Optional variable "${key}" is not set.${
          rule.description ? ` (${rule.description})` : ""
        }`
      );
      continue;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      invalid.push({
        key,
        reason: `Value does not match pattern ${rule.pattern.toString()}`,
      });
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

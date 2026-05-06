import { parseEnvContent } from './loader';
import { readFileSync } from 'fs';

export interface ValidationRule {
  key: string;
  required?: boolean;
  pattern?: RegExp;
  allowedValues?: string[];
  minLength?: number;
  maxLength?: number;
}

export interface ValidationIssue {
  key: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validateRecord(
  record: Record<string, string>,
  rules: ValidationRule[]
): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const rule of rules) {
    const value = record[rule.key];

    if (rule.required && (value === undefined || value === '')) {
      issues.push({ key: rule.key, message: `Required variable is missing or empty`, severity: 'error' });
      continue;
    }

    if (value === undefined) continue;

    if (rule.pattern && !rule.pattern.test(value)) {
      issues.push({ key: rule.key, message: `Value does not match pattern ${rule.pattern}`, severity: 'error' });
    }

    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      issues.push({
        key: rule.key,
        message: `Value "${value}" is not one of: ${rule.allowedValues.join(', ')}`,
        severity: 'error',
      });
    }

    if (rule.minLength !== undefined && value.length < rule.minLength) {
      issues.push({ key: rule.key, message: `Value length ${value.length} is below minimum ${rule.minLength}`, severity: 'warning' });
    }

    if (rule.maxLength !== undefined && value.length > rule.maxLength) {
      issues.push({ key: rule.key, message: `Value length ${value.length} exceeds maximum ${rule.maxLength}`, severity: 'warning' });
    }
  }

  return { valid: issues.filter(i => i.severity === 'error').length === 0, issues };
}

export function validateEnvFile(filePath: string, rules: ValidationRule[]): ValidationResult {
  const content = readFileSync(filePath, 'utf-8');
  const record = parseEnvContent(content);
  return validateRecord(record, rules);
}

export function formatValidationResult(result: ValidationResult): string {
  if (result.valid && result.issues.length === 0) return '✔ All validations passed.';
  const lines = result.issues.map(i => `  [${i.severity.toUpperCase()}] ${i.key}: ${i.message}`);
  const status = result.valid ? '⚠ Warnings found:' : '✖ Validation failed:';
  return [status, ...lines].join('\n');
}

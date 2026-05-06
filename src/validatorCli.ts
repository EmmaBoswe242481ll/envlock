import { readFileSync } from 'fs';
import { validateEnvFile, formatValidationResult, ValidationRule } from './validator';

export interface ValidatorArgs {
  envFile: string;
  rulesFile: string;
  json: boolean;
}

export function parseValidatorArgs(argv: string[]): ValidatorArgs {
  const args = argv.slice(2);
  let envFile = '.env';
  let rulesFile = '.env.rules.json';
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) envFile = args[++i];
    else if (args[i] === '--rules' && args[i + 1]) rulesFile = args[++i];
    else if (args[i] === '--json') json = true;
  }

  return { envFile, rulesFile, json };
}

export function loadRules(rulesFile: string): ValidationRule[] {
  const raw = readFileSync(rulesFile, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Rules file must contain a JSON array.');
  return parsed.map((r: Record<string, unknown>) => ({
    ...r,
    pattern: r.pattern ? new RegExp(r.pattern as string) : undefined,
  })) as ValidationRule[];
}

export function runValidator(argv: string[] = process.argv): void {
  const args = parseValidatorArgs(argv);

  let rules: ValidationRule[];
  try {
    rules = loadRules(args.rulesFile);
  } catch (e) {
    console.error(`Failed to load rules from "${args.rulesFile}": ${(e as Error).message}`);
    process.exit(1);
  }

  let result;
  try {
    result = validateEnvFile(args.envFile, rules);
  } catch (e) {
    console.error(`Failed to read env file "${args.envFile}": ${(e as Error).message}`);
    process.exit(1);
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatValidationResult(result));
  }

  process.exit(result.valid ? 0 : 1);
}

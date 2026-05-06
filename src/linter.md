# Linter

The `linter` module statically analyses `.env` files and reports issues without requiring a schema.

## Checks Performed

| Severity | Check |
|----------|-------|
| `error`  | Missing `=` separator on a non-comment line |
| `error`  | Key name does not match `[A-Za-z_][A-Za-z0-9_]*` |
| `warning`| Duplicate key (later definition shadows earlier) |
| `warning`| Sensitive key (`password`, `secret`, `token`) with value shorter than 8 chars |
| `info`   | Empty value |

Comments (`# …`) and blank lines are ignored.

## Programmatic Usage

```ts
import { lintEnvContent, formatLintResult } from './linter';

const content = require('fs').readFileSync('.env', 'utf-8');
const result = lintEnvContent(content, '.env');

if (!result.valid) {
  console.error(formatLintResult(result));
  process.exit(1);
}
```

## CLI Usage

```bash
# Lint the default .env
envlock lint

# Lint multiple files
envlock lint .env .env.production

# JSON output (suitable for CI artefacts)
envlock lint --json .env
```

Exit code is `0` when no errors are found, `1` otherwise (warnings and info do not affect the exit code).

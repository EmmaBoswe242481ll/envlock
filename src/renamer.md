# Renamer

The `renamer` module provides utilities to rename keys in `.env` files using a set of rename rules.

## Usage

### Programmatic

```typescript
import { parseRenameRules, applyRenames, formatRenameResult } from "./renamer";

const rules = parseRenameRules(["OLD_API_KEY=API_KEY", "DB_HOST=DATABASE_HOST"]);
const result = applyRenames({ OLD_API_KEY: "secret", DB_HOST: "localhost" }, rules);
console.log(formatRenameResult(result));
```

### CLI

```bash
# Rename using inline rules
envlock rename --input .env --rule OLD_KEY=NEW_KEY --rule FOO=BAR

# Rename using a rules file (one OLD=NEW per line)
envlock rename --input .env --rules-file rename-rules.txt --output .env.renamed

# Dry-run: preview changes without writing
envlock rename --input .env --rule OLD_KEY=NEW_KEY --dry-run
```

## Rules Format

Each rule is a string in the format `OLD_NAME=NEW_NAME`.

```
OLD_API_KEY=API_KEY
DB_HOST=DATABASE_HOST
SECRET_TOKEN=AUTH_TOKEN
```

## Behavior

| Scenario | Outcome |
|---|---|
| Key exists and target is free | Renamed successfully |
| Key does not exist | Skipped with reason `key not found` |
| Target key already exists | Skipped with reason `target key already exists` |

## Output

```
Renamed (2 renames applied):
  OLD_API_KEY → API_KEY
  DB_HOST → DATABASE_HOST

Skipped (1):
  MISSING_KEY → X  [key not found]
```

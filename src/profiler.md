# Profiler

The `profiler` module analyzes `.env` files and produces a statistical profile of their contents — including value lengths, type distribution, empty keys, and potential anomalies.

## Usage

```bash
npx envlock profile [file] [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--file`, `-f` | Path to the `.env` file (default: `.env`) |
| `--json` | Output result as JSON |
| `--min-length <n>` | Warn if any value is shorter than `n` characters |
| `--max-length <n>` | Warn if any value is longer than `n` characters |

## Examples

```bash
# Profile the default .env
npx envlock profile

# Profile a specific file with JSON output
npx envlock profile staging.env --json

# Warn on short or long values
npx envlock profile --min-length 4 --max-length 128
```

## Output

Text output includes:

- Total number of keys
- Count of empty values
- Value length statistics (min, max, average)
- Type distribution (string, number, boolean, url, etc.)
- Any warnings based on length thresholds

## API

```ts
import { profileEnvFile, formatProfileResult } from "./profiler";

const result = profileEnvFile(content, { minLength: 4, maxLength: 128 });
console.log(formatProfileResult(result));
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No warnings |
| `1` | One or more warnings detected |

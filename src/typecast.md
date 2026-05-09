# Typecast

The `typecast` module infers and casts `.env` values from strings to their native JavaScript types.

## Overview

All `.env` values are strings by default. The typecast module analyzes each value and converts it to the most appropriate type:

- `"true"` / `"false"` → `boolean`
- `"42"` / `"3.14"` → `number`
- `"null"` → `null`
- Everything else → `string`

## API

### `inferType(value: string): string`

Returns the inferred type name: `"boolean"`, `"number"`, `"null"`, or `"string"`.

### `castValue(value: string): unknown`

Converts a string value to its inferred native type.

### `typecastRecord(record: Record<string, string>): Record<string, unknown>`

Applies `castValue` to every entry in the record and returns a new record with native-typed values.

### `formatTypecastReport(result: Record<string, unknown>): string`

Formats a human-readable report of the typecast results, showing key, original string, and inferred type.

## CLI Usage

```bash
npx ts-node src/typecastCli.ts --input .env
npx ts-node src/typecastCli.ts --input .env --json
npx ts-node src/typecastCli.ts --input .env --apply --output .env.typed
```

### Flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--input` | `-i` | Path to `.env` file (default: `.env`) |
| `--output` | `-o` | Path to write cast output |
| `--json` | | Output results as JSON |
| `--apply` | | Write cast values to `--output` file |

## Example

Given `.env`:
```
PORT=8080
DEBUG=true
APP_NAME=myapp
MAX_RETRIES=null
```

Output:
```
PORT        8080    → number
DEBUG       true    → boolean
APP_NAME    myapp   → string
MAX_RETRIES null    → null
```

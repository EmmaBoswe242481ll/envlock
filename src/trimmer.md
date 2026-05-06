# Trimmer Module

The `trimmer` module strips leading/trailing whitespace from `.env` values, helping prevent subtle bugs caused by accidental spaces.

## Functions

### `trimValue(value: string): string`
Trims leading and trailing whitespace from a single value.

### `trimEnvRecord(record: Record<string, string>): Record<string, string>`
Applies trimming to all values in a key-value record.

### `trimEnvContent(content: string): string`
Parses raw `.env` content, trims values, and returns updated content.

### `formatTrimResult(original: Record<string, string>, trimmed: Record<string, string>): string`
Returns a human-readable summary of which keys had values trimmed.

## Usage

```ts
import { trimEnvContent } from './trimmer';

const raw = `NAME=  Alice  \nPORT= 3000 `;
const clean = trimEnvContent(raw);
// NAME=Alice
// PORT=3000
```

## CLI

```bash
envlock trim --file .env
envlock trim --file .env --output .env.trimmed
envlock trim --file .env --dry-run
```

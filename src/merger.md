# Env Merger

The **merger** module allows you to combine multiple `.env` files into a single merged output, with configurable conflict resolution strategies.

## Strategies

| Strategy | Behaviour |
|---|---|
| `last-wins` | Later files override earlier values (default) |
| `first-wins` | Earlier files take precedence |
| `error-on-conflict` | Throws an error if the same key has different values |

## Programmatic Usage

```ts
import { mergeEnvFiles, formatMergeResult } from "./merger";

const result = mergeEnvFiles([".env", ".env.local"], { strategy: "last-wins" });
console.log(formatMergeResult(result));

if (result.conflicts.length > 0) {
  console.warn("Conflicts:", result.conflicts);
}
```

## CLI Usage

```bash
# Merge two files, last file wins
envlock-merge .env .env.local

# Use first-wins strategy and write to a new file
envlock-merge .env .env.local --strategy first-wins --output merged.env

# Show conflicts after merging
envlock-merge .env .env.local --show-conflicts
```

## Output Format

The merged output is standard `.env` format:

```
DB_HOST=localhost
DB_PORT=5432
API_KEY=secret
```

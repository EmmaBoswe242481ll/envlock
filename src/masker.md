# Masker

The `masker` module redacts sensitive values in `.env` files for safe display in logs, reports, or CI output.

## Features

- Detects sensitive keys by name patterns (e.g. `SECRET`, `PASSWORD`, `TOKEN`, `KEY`)
- Masks values while optionally preserving a configurable number of visible characters
- Supports custom mask characters
- Outputs as plain text or JSON

## API

### `maskValue(value, options?)`

Masks a single string value.

```ts
maskValue("supersecret", { visibleChars: 2, maskChar: "*" });
// => "su*********"
```

### `maskRecord(record, options?)`

Masks all sensitive keys in a `Record<string, string>`.

```ts
const masked = maskRecord({ API_KEY: "abc123", PORT: "3000" });
// => { API_KEY: "ab****", PORT: "3000" }
```

### `formatMaskResult(original, masked, format?)`

Formats the masked result as `"text"` (default) or `"json"`.

## CLI

```bash
npx envlock mask --input .env --format text --visible 2 --char "*"
npx envlock mask --input .env --output masked.env
```

### Options

| Flag | Alias | Default | Description |
|------|-------|---------|-------------|
| `--input` | `-i` | `.env` | Input file path |
| `--output` | `-o` | — | Write result to file instead of stdout |
| `--format` | | `text` | Output format: `text` or `json` |
| `--visible` | | `2` | Number of visible characters at start of value |
| `--char` | | `*` | Character used for masking |

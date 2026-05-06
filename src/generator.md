# Generator

The `generator` module creates `.env` schema files from existing `.env` files. This is useful for bootstrapping a schema when adopting `envlock` on an existing project.

## Usage

### Programmatic

```ts
import { generateSchema, generateSchemaFile } from "./generator";

// Generate JSON schema string from .env content
const schema = generateSchema(envContent, "json");

// Write schema directly to a file
generateSchemaFile(envContent, ".env.schema.json", "json");
```

### CLI

```bash
npx envlock generate-schema --input .env --output .env.schema.json --format json
```

#### Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--input` | `-i` | `.env` | Path to source `.env` file |
| `--output` | `-o` | `.env.schema.json` | Path to write schema output |
| `--format` | | `json` | Output format: `json` or `env` |

## Output Formats

### JSON

```json
{
  "APP_NAME": {
    "required": false,
    "default": "myapp",
    "description": "Application name"
  },
  "DB_URL": {
    "required": true
  }
}
```

### ENV

```env
# Application name
APP_NAME=myapp

# required: true
DB_URL=
```

## Notes

- Comments immediately preceding a variable are captured as `description`.
- Variables with empty values are marked as `required: true`.
- The generated schema is compatible with `validateEnv` in `schema.ts`.

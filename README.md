# envlock

> A lightweight utility to validate and snapshot `.env` files against a schema, preventing missing variable surprises in CI.

---

## Installation

```bash
npm install --save-dev envlock
# or
yarn add -D envlock
```

## Usage

Define a schema file (`.env.schema`) listing all required variables:

```
DATABASE_URL
API_KEY
PORT
NODE_ENV
```

Then run the validator in your CI pipeline or as a pre-start script:

```bash
npx envlock validate --schema .env.schema --env .env
```

Or use it programmatically in TypeScript:

```typescript
import { validate } from "envlock";

const result = validate({
  schema: ".env.schema",
  env: ".env",
});

if (!result.valid) {
  console.error("Missing variables:", result.missing);
  process.exit(1);
}
```

You can also snapshot your current `.env` structure to generate a schema automatically:

```bash
npx envlock snapshot --env .env --output .env.schema
```

Commit `.env.schema` to version control — never `.env` itself.

## Why envlock?

- ✅ Zero runtime dependencies
- ✅ Works with any CI provider
- ✅ Catches missing variables before they cause production failures
- ✅ Keeps `.env.example` and schema in sync

## License

[MIT](./LICENSE)
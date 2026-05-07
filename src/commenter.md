# Commenter Module

The `commenter` module allows you to add, update, strip, and manage inline comments in `.env` files.

## Functions

### `parseWithComments(content: string): CommentedEntry[]`
Parses `.env` content into structured entries preserving comments.

### `applyComments(entries: CommentedEntry[], comments: Record<string, string>): CommentedEntry[]`
Applies a map of key → comment to existing entries.

### `stripComments(entries: CommentedEntry[]): CommentedEntry[]`
Removes all inline and block comments from entries.

### `formatCommentResult(entries: CommentedEntry[]): string`
Serializes entries back to `.env` format with comments.

## CLI Usage

```bash
# Add comments from a JSON map
envlock comment --env .env --comments comments.json --output .env.commented

# Strip all comments
envlock comment --env .env --strip --output .env.clean
```

## Example

Input `.env`:
```
DB_HOST=localhost
API_KEY=secret
```

Comments JSON:
```json
{ "DB_HOST": "Database hostname", "API_KEY": "Third-party API key" }
```

Output:
```
# Database hostname
DB_HOST=localhost
# Third-party API key
API_KEY=secret
```

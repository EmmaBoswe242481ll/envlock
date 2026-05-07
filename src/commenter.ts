/**
 * commenter.ts
 * Add, update, or strip inline comments from .env files.
 */

export interface CommentedRecord {
  key: string;
  value: string;
  comment: string | null;
}

/**
 * Parse env content into records preserving inline comments.
 */
export function parseWithComments(content: string): CommentedRecord[] {
  return content
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) return null;
      const key = line.slice(0, eqIdx).trim();
      const rest = line.slice(eqIdx + 1);
      const commentIdx = rest.search(/ #/);
      if (commentIdx !== -1) {
        return {
          key,
          value: rest.slice(0, commentIdx).trim(),
          comment: rest.slice(commentIdx + 2).trim(),
        };
      }
      return { key, value: rest.trim(), comment: null };
    })
    .filter((r): r is CommentedRecord => r !== null);
}

/**
 * Apply a map of key -> comment to existing env content.
 */
export function applyComments(
  content: string,
  comments: Record<string, string>
): string {
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) return line;
      const key = line.slice(0, eqIdx).trim();
      if (!comments[key]) return line;
      const bare = line.replace(/ #.*$/, "").trimEnd();
      return `${bare} # ${comments[key]}`;
    })
    .join("\n");
}

/**
 * Strip all inline comments from env content.
 */
export function stripComments(content: string): string {
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      return line.replace(/ #.*$/, "").trimEnd();
    })
    .join("\n");
}

export function formatCommentResult(records: CommentedRecord[]): string {
  return records
    .map((r) => (r.comment ? `${r.key}=${r.value} # ${r.comment}` : `${r.key}=${r.value}`))
    .join("\n");
}

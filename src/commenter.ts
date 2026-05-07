export interface CommentedEntry {
  key: string;
  value: string;
  comment?: string;
}

export function parseWithComments(content: string): CommentedEntry[] {
  const lines = content.split("\n");
  const entries: CommentedEntry[] = [];
  let pendingComment: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      pendingComment = trimmed.slice(1).trim();
      continue;
    }
    if (!trimmed || !trimmed.includes("=")) {
      pendingComment = undefined;
      continue;
    }
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    entries.push({ key, value, comment: pendingComment });
    pendingComment = undefined;
  }
  return entries;
}

export function applyComments(
  entries: CommentedEntry[],
  comments: Record<string, string>
): CommentedEntry[] {
  return entries.map((entry) =>
    comments[entry.key] !== undefined
      ? { ...entry, comment: comments[entry.key] }
      : entry
  );
}

export function stripComments(entries: CommentedEntry[]): CommentedEntry[] {
  return entries.map(({ key, value }) => ({ key, value }));
}

export function formatCommentResult(entries: CommentedEntry[]): string {
  return (
    entries
      .map((entry) => {
        const commentLine = entry.comment ? `# ${entry.comment}\n` : "";
        return `${commentLine}${entry.key}=${entry.value}`;
      })
      .join("\n") + "\n"
  );
}

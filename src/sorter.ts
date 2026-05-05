/**
 * sorter.ts — Sort .env file keys alphabetically or by custom group order.
 */

export type SortMode = "alpha" | "grouped";

export interface SortOptions {
  mode?: SortMode;
  groups?: string[][];
  commentPreserve?: boolean;
}

export interface SortResult {
  sorted: string;
  originalCount: number;
  sortedCount: number;
  mode: SortMode;
}

/**
 * Parse env content into lines, preserving comments and blank lines.
 */
export function parseEnvLines(
  content: string
): { key: string | null; line: string }[] {
  return content.split("\n").map((line) => {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      return { key: null, line };
    }
    const eqIndex = line.indexOf("=");
    const key = eqIndex !== -1 ? line.slice(0, eqIndex).trim() : null;
    return { key, line };
  });
}

/**
 * Sort env content alphabetically, keeping comments attached to the key below them.
 */
export function sortAlpha(content: string): string {
  const rawLines = content.split("\n");
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
      continue;
    }
    currentBlock.push(line);
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);

  const keyBlocks = blocks.filter((b) =>
    b.some((l) => !l.trim().startsWith("#") && l.includes("="))
  );
  const headerBlocks = blocks.filter(
    (b) => !b.some((l) => !l.trim().startsWith("#") && l.includes("="))
  );

  keyBlocks.sort((a, b) => {
    const keyA = (a.find((l) => l.includes("=")) ?? "").split("=")[0].trim();
    const keyB = (b.find((l) => l.includes("=")) ?? "").split("=")[0].trim();
    return keyA.localeCompare(keyB);
  });

  const allBlocks = [...headerBlocks, ...keyBlocks];
  return allBlocks.map((b) => b.join("\n")).join("\n\n");
}

/**
 * Sort env content by explicit key groups, ungrouped keys appended at end.
 */
export function sortGrouped(content: string, groups: string[][]): string {
  const lines = content.split("\n");
  const keyLineMap: Record<string, string> = {};

  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const key = line.split("=")[0].trim();
    keyLineMap[key] = line;
  }

  const used = new Set<string>();
  const sections: string[] = [];

  for (const group of groups) {
    const groupLines: string[] = [];
    for (const key of group) {
      if (keyLineMap[key]) {
        groupLines.push(keyLineMap[key]);
        used.add(key);
      }
    }
    if (groupLines.length > 0) sections.push(groupLines.join("\n"));
  }

  const remaining = Object.keys(keyLineMap)
    .filter((k) => !used.has(k))
    .sort()
    .map((k) => keyLineMap[k]);

  if (remaining.length > 0) sections.push(remaining.join("\n"));
  return sections.join("\n\n");
}

/**
 * Main sort entry point.
 */
export function sortEnv(content: string, options: SortOptions = {}): SortResult {
  const mode = options.mode ?? "alpha";
  const originalCount = content
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("=")).length;

  const sorted =
    mode === "grouped" && options.groups
      ? sortGrouped(content, options.groups)
      : sortAlpha(content);

  const sortedCount = sorted
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("=")).length;

  return { sorted, originalCount, sortedCount, mode };
}

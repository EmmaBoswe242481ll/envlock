import * as fs from "fs";
import * as path from "path";

export interface LoadedEnv {
  vars: Record<string, string>;
  filePath: string;
}

export class EnvLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvLoadError";
  }
}

/**
 * Parse a .env file content into a key-value record.
 * Supports comments (#), blank lines, and quoted values.
 */
export function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    // Skip blank lines and comments
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Load and parse a .env file from the given path.
 */
export function loadEnvFile(filePath: string): LoadedEnv {
  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {
    throw new EnvLoadError(`Env file not found: ${resolved}`);
  }

  let content: string;
  try {
    content = fs.readFileSync(resolved, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new EnvLoadError(`Failed to read env file: ${resolved} (${message})`);
  }

  const vars = parseEnvContent(content);

  return { vars, filePath: resolved };
}

/**
 * Merge multiple env files, with later files taking precedence.
 */
export function mergeEnvFiles(filePaths: string[]): LoadedEnv {
  const merged: Record<string, string> = {};
  let lastPath = "";

  for (const filePath of filePaths) {
    const { vars, filePath: resolved } = loadEnvFile(filePath);
    Object.assign(merged, vars);
    lastPath = resolved;
  }

  return { vars: merged, filePath: lastPath };
}

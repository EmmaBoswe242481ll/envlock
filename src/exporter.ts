import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./loader";

export type ExportFormat = "json" | "yaml" | "dotenv";

export function exportToJson(record: Record<string, string>): string {
  return JSON.stringify(record, null, 2);
}

export function exportToYaml(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => {
      const escaped = value.includes(":") || value.includes("#")
        ? `"${value.replace(/"/g, '\\"')}"`
        : value;
      return `${key}: ${escaped}`;
    })
    .join("\n");
}

export function exportToDotenv(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => {
      const needsQuotes = /\s|#|"/.test(value);
      const escaped = needsQuotes
        ? `"${value.replace(/"/g, '\\"')}"`
        : value;
      return `${key}=${escaped}`;
    })
    .join("\n");
}

export function exportEnv(
  content: string,
  format: ExportFormat
): string {
  const record = parseEnvContent(content);
  switch (format) {
    case "json":
      return exportToJson(record);
    case "yaml":
      return exportToYaml(record);
    case "dotenv":
      return exportToDotenv(record);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

export function exportEnvFile(
  inputPath: string,
  outputPath: string,
  format: ExportFormat
): void {
  const content = fs.readFileSync(inputPath, "utf-8");
  const output = exportEnv(content, format);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, "utf-8");
}

import { writeFileSync } from "fs";

export interface SchemaField {
  key: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export function parseEnvToSchema(content: string): SchemaField[] {
  const lines = content.split("\n");
  const fields: SchemaField[] = [];
  let lastComment = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      lastComment = trimmed.slice(1).trim();
      continue;
    }
    if (!trimmed || !trimmed.includes("=")) {
      lastComment = "";
      continue;
    }
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    fields.push({
      key,
      required: value === "",
      defaultValue: value !== "" ? value : undefined,
      description: lastComment || undefined,
    });
    lastComment = "";
  }
  return fields;
}

export function generateSchemaJson(fields: SchemaField[]): string {
  const schema: Record<string, unknown> = {};
  for (const field of fields) {
    schema[field.key] = {
      required: field.required,
      ...(field.defaultValue !== undefined && { default: field.defaultValue }),
      ...(field.description && { description: field.description }),
    };
  }
  return JSON.stringify(schema, null, 2);
}

export function generateSchemaEnv(fields: SchemaField[]): string {
  return fields
    .map((f) => {
      const lines: string[] = [];
      if (f.description) lines.push(`# ${f.description}`);
      if (f.required) lines.push(`# required: true`);
      lines.push(`${f.key}=${f.defaultValue ?? ""}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function generateSchema(
  content: string,
  format: "json" | "env" = "json"
): string {
  const fields = parseEnvToSchema(content);
  return format === "json"
    ? generateSchemaJson(fields)
    : generateSchemaEnv(fields);
}

export function generateSchemaFile(
  inputContent: string,
  outputPath: string,
  format: "json" | "env" = "json"
): void {
  const output = generateSchema(inputContent, format);
  writeFileSync(outputPath, output, "utf-8");
}

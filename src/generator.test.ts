import { describe, it, expect } from "vitest";
import {
  parseEnvToSchema,
  generateSchemaJson,
  generateSchemaEnv,
  generateSchema,
} from "./generator";

const sampleEnv = `# Application name
APP_NAME=myapp

# Database URL (required)
DB_URL=

PORT=3000
`;

describe("parseEnvToSchema", () => {
  it("parses keys and values", () => {
    const fields = parseEnvToSchema(sampleEnv);
    expect(fields).toHaveLength(3);
    expect(fields[0].key).toBe("APP_NAME");
    expect(fields[0].defaultValue).toBe("myapp");
    expect(fields[0].required).toBe(false);
  });

  it("marks empty values as required", () => {
    const fields = parseEnvToSchema(sampleEnv);
    expect(fields[1].key).toBe("DB_URL");
    expect(fields[1].required).toBe(true);
    expect(fields[1].defaultValue).toBeUndefined();
  });

  it("captures inline descriptions from comments", () => {
    const fields = parseEnvToSchema(sampleEnv);
    expect(fields[0].description).toBe("Application name");
    expect(fields[2].description).toBeUndefined();
  });
});

describe("generateSchemaJson", () => {
  it("produces valid JSON", () => {
    const fields = parseEnvToSchema(sampleEnv);
    const json = generateSchemaJson(fields);
    const parsed = JSON.parse(json);
    expect(parsed.APP_NAME).toEqual({
      required: false,
      default: "myapp",
      description: "Application name",
    });
    expect(parsed.DB_URL).toEqual({ required: true, description: "Database URL (required)" });
  });
});

describe("generateSchemaEnv", () => {
  it("outputs env-style schema with comments", () => {
    const fields = parseEnvToSchema(sampleEnv);
    const output = generateSchemaEnv(fields);
    expect(output).toContain("# Application name");
    expect(output).toContain("APP_NAME=myapp");
    expect(output).toContain("# required: true");
    expect(output).toContain("DB_URL=");
  });
});

describe("generateSchema", () => {
  it("defaults to json format", () => {
    const result = generateSchema(sampleEnv);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("returns env format when specified", () => {
    const result = generateSchema(sampleEnv, "env");
    expect(result).toContain("APP_NAME=");
    expect(result).not.toContain("{");
  });
});

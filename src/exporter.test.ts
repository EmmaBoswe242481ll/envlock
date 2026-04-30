import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  exportToJson,
  exportToYaml,
  exportToDotenv,
  exportEnv,
  exportEnvFile,
} from "./exporter";

const sample: Record<string, string> = {
  APP_NAME: "envlock",
  PORT: "3000",
  DB_URL: "postgres://localhost:5432/db",
};

describe("exportToJson", () => {
  it("should serialize record to formatted JSON", () => {
    const result = exportToJson(sample);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(sample);
  });
});

describe("exportToYaml", () => {
  it("should serialize record to YAML lines", () => {
    const result = exportToYaml({ APP_NAME: "envlock", PORT: "3000" });
    expect(result).toContain("APP_NAME: envlock");
    expect(result).toContain("PORT: 3000");
  });

  it("should quote values containing colons", () => {
    const result = exportToYaml({ DB_URL: "postgres://localhost:5432/db" });
    expect(result).toContain('DB_URL: "postgres://localhost:5432/db"');
  });
});

describe("exportToDotenv", () => {
  it("should produce valid dotenv format", () => {
    const result = exportToDotenv({ APP_NAME: "envlock", PORT: "3000" });
    expect(result).toContain("APP_NAME=envlock");
    expect(result).toContain("PORT=3000");
  });

  it("should quote values with spaces", () => {
    const result = exportToDotenv({ GREETING: "hello world" });
    expect(result).toContain('GREETING="hello world"');
  });
});

describe("exportEnv", () => {
  const envContent = "APP_NAME=envlock\nPORT=3000\n";

  it("should export to json format", () => {
    const result = exportEnv(envContent, "json");
    expect(JSON.parse(result)).toMatchObject({ APP_NAME: "envlock", PORT: "3000" });
  });

  it("should export to yaml format", () => {
    const result = exportEnv(envContent, "yaml");
    expect(result).toContain("APP_NAME: envlock");
  });

  it("should export to dotenv format", () => {
    const result = exportEnv(envContent, "dotenv");
    expect(result).toContain("APP_NAME=envlock");
  });

  it("should throw on unsupported format", () => {
    expect(() => exportEnv(envContent, "xml" as any)).toThrow("Unsupported export format");
  });
});

describe("exportEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "envlock-export-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should write exported content to output file", () => {
    const inputPath = path.join(tmpDir, ".env");
    const outputPath = path.join(tmpDir, "out", "env.json");
    fs.writeFileSync(inputPath, "APP_NAME=envlock\nPORT=3000\n");
    exportEnvFile(inputPath, outputPath, "json");
    const written = fs.readFileSync(outputPath, "utf-8");
    expect(JSON.parse(written)).toMatchObject({ APP_NAME: "envlock", PORT: "3000" });
  });
});

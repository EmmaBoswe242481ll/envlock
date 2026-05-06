import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parseGenerateArgs } from "./generatorCli";
import { generateSchemaFile } from "./generator";

function writeTempEnv(content: string): string {
  const path = join(tmpdir(), `test-gen-${Date.now()}.env`);
  writeFileSync(path, content, "utf-8");
  return path;
}

describe("parseGenerateArgs", () => {
  it("returns defaults when no args given", () => {
    const args = parseGenerateArgs([]);
    expect(args.input).toBe(".env");
    expect(args.output).toBe(".env.schema.json");
    expect(args.format).toBe("json");
  });

  it("parses --input and --output", () => {
    const args = parseGenerateArgs(["--input", "my.env", "--output", "out.json"]);
    expect(args.input).toBe("my.env");
    expect(args.output).toBe("out.json");
  });

  it("parses short flags -i and -o", () => {
    const args = parseGenerateArgs(["-i", "a.env", "-o", "b.json"]);
    expect(args.input).toBe("a.env");
    expect(args.output).toBe("b.json");
  });

  it("parses --format env", () => {
    const args = parseGenerateArgs(["--format", "env"]);
    expect(args.format).toBe("env");
  });
});

describe("generateSchemaFile integration", () => {
  let inputPath: string;
  let outputPath: string;

  beforeEach(() => {
    inputPath = writeTempEnv("# App\nAPP=hello\nSECRET=\n");
    outputPath = join(tmpdir(), `test-schema-out-${Date.now()}.json`);
  });

  afterEach(() => {
    if (existsSync(inputPath)) unlinkSync(inputPath);
    if (existsSync(outputPath)) unlinkSync(outputPath);
  });

  it("writes a json schema file", () => {
    const content = readFileSync(inputPath, "utf-8");
    generateSchemaFile(content, outputPath, "json");
    expect(existsSync(outputPath)).toBe(true);
    const parsed = JSON.parse(readFileSync(outputPath, "utf-8"));
    expect(parsed.APP).toBeDefined();
    expect(parsed.SECRET.required).toBe(true);
  });

  it("writes an env schema file", () => {
    const envOutputPath = outputPath.replace(".json", ".env");
    const content = readFileSync(inputPath, "utf-8");
    generateSchemaFile(content, envOutputPath, "env");
    expect(existsSync(envOutputPath)).toBe(true);
    const out = readFileSync(envOutputPath, "utf-8");
    expect(out).toContain("APP=hello");
    if (existsSync(envOutputPath)) unlinkSync(envOutputPath);
  });
});

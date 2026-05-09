import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { profileEnvRecord, profileEnvFile, formatProfileResult } from "./profiler";

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `profiler-test-${Date.now()}.env`);
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("profileEnvRecord", () => {
  it("counts total keys", () => {
    const result = profileEnvRecord({ A: "1", B: "2", C: "3" });
    expect(result.totalKeys).toBe(3);
  });

  it("detects empty values", () => {
    const result = profileEnvRecord({ EMPTY: "", FULL: "value" });
    expect(result.emptyValues).toContain("EMPTY");
    expect(result.emptyValues).not.toContain("FULL");
  });

  it("detects long values over 100 chars", () => {
    const long = "x".repeat(101);
    const result = profileEnvRecord({ LONG_VAL: long, SHORT: "hi" });
    expect(result.longValues).toContain("LONG_VAL");
    expect(result.longValues).not.toContain("SHORT");
  });

  it("detects numeric values", () => {
    const result = profileEnvRecord({ PORT: "3000", NAME: "app" });
    expect(result.numericValues).toContain("PORT");
    expect(result.numericValues).not.toContain("NAME");
  });

  it("detects boolean values", () => {
    const result = profileEnvRecord({ DEBUG: "true", VERBOSE: "false", NAME: "app" });
    expect(result.booleanValues).toContain("DEBUG");
    expect(result.booleanValues).toContain("VERBOSE");
    expect(result.booleanValues).not.toContain("NAME");
  });

  it("detects URL values", () => {
    const result = profileEnvRecord({ API_URL: "https://example.com", NAME: "app" });
    expect(result.urlValues).toContain("API_URL");
    expect(result.urlValues).not.toContain("NAME");
  });

  it("detects secret-like keys", () => {
    const result = profileEnvRecord({ API_KEY: "abc", DB_PASSWORD: "secret", NAME: "app" });
    expect(result.secretLikeKeys).toContain("API_KEY");
    expect(result.secretLikeKeys).toContain("DB_PASSWORD");
    expect(result.secretLikeKeys).not.toContain("NAME");
  });

  it("calculates average value length", () => {
    const result = profileEnvRecord({ A: "ab", B: "abcd" });
    expect(result.averageValueLength).toBe(3);
  });

  it("handles empty record", () => {
    const result = profileEnvRecord({});
    expect(result.totalKeys).toBe(0);
    expect(result.averageValueLength).toBe(0);
  });
});

describe("profileEnvFile", () => {
  it("reads and profiles a file", () => {
    const file = writeTempEnv("PORT=8080\nDEBUG=true\nSECRET_KEY=abc123\n");
    const result = profileEnvFile(file);
    expect(result.totalKeys).toBe(3);
    expect(result.numericValues).toContain("PORT");
    expect(result.booleanValues).toContain("DEBUG");
    expect(result.secretLikeKeys).toContain("SECRET_KEY");
    fs.unlinkSync(file);
  });
});

describe("formatProfileResult", () => {
  it("returns a readable string", () => {
    const profile = profileEnvRecord({ PORT: "3000", SECRET: "abc", EMPTY: "" });
    const output = formatProfileResult(profile);
    expect(output).toContain("Total keys:");
    expect(output).toContain("Empty values:");
    expect(output).toContain("Secret-like keys:");
  });
});

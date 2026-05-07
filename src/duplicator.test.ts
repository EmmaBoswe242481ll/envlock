import { describe, it, expect } from "vitest";
import {
  findDuplicateKeys,
  findDuplicateValues,
  detectDuplicates,
  formatDuplicateResult,
} from "./duplicator";

const sampleContent = `
DB_HOST=localhost
DB_PORT=5432
DB_HOST=remotehost
API_KEY=secret
API_URL=https://example.com
`;

const sampleRecord: Record<string, string> = {
  DB_HOST: "localhost",
  DB_PORT: "5432",
  API_KEY: "secret",
  API_SECRET: "secret",
  API_URL: "https://example.com",
};

describe("findDuplicateKeys", () => {
  it("detects duplicate keys with line numbers", () => {
    const result = findDuplicateKeys(sampleContent);
    expect(result).toHaveProperty("DB_HOST");
    expect(result["DB_HOST"]).toHaveLength(2);
  });

  it("ignores comment lines", () => {
    const content = "# DB_HOST=foo\nDB_HOST=bar\n";
    const result = findDuplicateKeys(content);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("returns empty object when no duplicates", () => {
    const content = "A=1\nB=2\nC=3\n";
    expect(findDuplicateKeys(content)).toEqual({});
  });
});

describe("findDuplicateValues", () => {
  it("detects keys sharing the same value", () => {
    const result = findDuplicateValues(sampleRecord);
    expect(result).toHaveProperty("secret");
    expect(result["secret"]).toContain("API_KEY");
    expect(result["secret"]).toContain("API_SECRET");
  });

  it("ignores empty values", () => {
    const record = { A: "", B: "" };
    expect(findDuplicateValues(record)).toEqual({});
  });

  it("returns empty when all values are unique", () => {
    const record = { A: "1", B: "2", C: "3" };
    expect(findDuplicateValues(record)).toEqual({});
  });
});

describe("detectDuplicates", () => {
  it("returns hasDuplicates true when issues exist", () => {
    const result = detectDuplicates(sampleContent, sampleRecord);
    expect(result.hasDuplicates).toBe(true);
  });

  it("returns hasDuplicates false for clean input", () => {
    const result = detectDuplicates("A=1\nB=2\n", { A: "1", B: "2" });
    expect(result.hasDuplicates).toBe(false);
  });
});

describe("formatDuplicateResult", () => {
  it("returns no-duplicates message for clean result", () => {
    const result = detectDuplicates("A=1\nB=2\n", { A: "1", B: "2" });
    expect(formatDuplicateResult(result)).toBe("No duplicates found.");
  });

  it("includes duplicate key info in output", () => {
    const result = detectDuplicates(sampleContent, sampleRecord);
    const output = formatDuplicateResult(result);
    expect(output).toContain("DB_HOST");
  });

  it("includes duplicate value info in output", () => {
    const result = detectDuplicates(sampleContent, sampleRecord);
    const output = formatDuplicateResult(result);
    expect(output).toContain("secret");
  });
});

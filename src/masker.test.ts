import { describe, it, expect } from "vitest";
import {
  maskValue,
  maskRecord,
  formatMaskResult,
} from "./masker";

describe("maskValue", () => {
  it("returns empty string unchanged", () => {
    expect(maskValue("")).toBe("");
  });

  it("masks fully in full mode", () => {
    expect(maskValue("secret123", { mode: "full", maskChar: "*" })).toBe("*********");
  });

  it("masks partially showing first 4 chars by default", () => {
    const result = maskValue("mysecretvalue");
    expect(result.startsWith("myse")).toBe(true);
    expect(result).toContain("***");
  });

  it("respects custom visibleChars", () => {
    const result = maskValue("abcdefgh", { mode: "partial", visibleChars: 2 });
    expect(result.startsWith("ab")).toBe(true);
    expect(result.length).toBeGreaterThan(2);
  });

  it("masks with length mode", () => {
    const result = maskValue("supersecret", { mode: "length" });
    expect(result).toContain("(11 chars)");
    expect(result).toContain("****");
  });

  it("handles very short values in partial mode", () => {
    const result = maskValue("ab", { mode: "partial", visibleChars: 4 });
    expect(result.startsWith("ab")).toBe(true);
  });
});

describe("maskRecord", () => {
  const record = {
    API_KEY: "super-secret-key",
    DATABASE_URL: "postgres://localhost/db",
    APP_NAME: "myapp",
    PASSWORD: "hunter2",
  };

  it("masks only specified sensitive keys", () => {
    const result = maskRecord(record, ["API_KEY", "PASSWORD"]);
    expect(result.masked["API_KEY"]).not.toBe("super-secret-key");
    expect(result.masked["PASSWORD"]).not.toBe("hunter2");
    expect(result.masked["APP_NAME"]).toBe("myapp");
    expect(result.masked["DATABASE_URL"]).toBe("postgres://localhost/db");
  });

  it("tracks maskedKeys correctly", () => {
    const result = maskRecord(record, ["API_KEY", "PASSWORD"]);
    expect(result.maskedKeys).toContain("API_KEY");
    expect(result.maskedKeys).toContain("PASSWORD");
    expect(result.maskedKeys).not.toContain("APP_NAME");
  });

  it("preserves original record reference", () => {
    const result = maskRecord(record, ["API_KEY"]);
    expect(result.original).toBe(record);
  });

  it("is case-insensitive for key matching", () => {
    const result = maskRecord(record, ["api_key"]);
    expect(result.maskedKeys).toContain("API_KEY");
  });

  it("returns all keys unmasked when sensitiveKeys is empty", () => {
    const result = maskRecord(record, []);
    expect(result.maskedKeys).toHaveLength(0);
    expect(result.masked).toEqual(record);
  });
});

describe("formatMaskResult", () => {
  it("includes masked key count in output", () => {
    const result = maskRecord({ SECRET: "abc", NAME: "test" }, ["SECRET"]);
    const output = formatMaskResult(result);
    expect(output).toContain("Masked 1 key(s)");
    expect(output).toContain("SECRET");
    expect(output).toContain("NAME=test");
  });

  it("shows none when no keys masked", () => {
    const result = maskRecord({ NAME: "test" }, []);
    const output = formatMaskResult(result);
    expect(output).toContain("none");
  });
});

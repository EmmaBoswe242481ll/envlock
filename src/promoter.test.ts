import { describe, it, expect } from "vitest";
import { promoteEnv, formatPromoteResult, serializeEnvRecord } from "./promoter";

describe("promoteEnv", () => {
  const source = { DB_HOST: "staging-db", API_KEY: "stg-key", SECRET: "abc" };
  const target = { DB_HOST: "prod-db", PORT: "443" };
  const templateKeys = ["DB_HOST", "API_KEY", "MISSING_KEY"];

  it("promotes keys from source that exist in template", () => {
    const { result, summary } = promoteEnv(source, target, templateKeys, {
      overwrite: true,
      dryRun: false,
    });
    expect(result["API_KEY"]).toBe("stg-key");
    expect(summary.promoted).toContain("API_KEY");
  });

  it("skips existing target keys when overwrite is false", () => {
    const { result, summary } = promoteEnv(source, target, templateKeys, {
      overwrite: false,
      dryRun: false,
    });
    expect(result["DB_HOST"]).toBe("prod-db");
    expect(summary.skipped).toContain("DB_HOST");
  });

  it("overwrites existing target keys when overwrite is true", () => {
    const { result, summary } = promoteEnv(source, target, templateKeys, {
      overwrite: true,
      dryRun: false,
    });
    expect(result["DB_HOST"]).toBe("staging-db");
    expect(summary.promoted).toContain("DB_HOST");
  });

  it("reports missing keys from source", () => {
    const { summary } = promoteEnv(source, target, templateKeys, {
      overwrite: false,
      dryRun: false,
    });
    expect(summary.missing).toContain("MISSING_KEY");
  });

  it("does not modify target keys not in template", () => {
    const { result } = promoteEnv(source, target, templateKeys, {
      overwrite: true,
      dryRun: false,
    });
    expect(result["PORT"]).toBe("443");
  });
});

describe("formatPromoteResult", () => {
  it("includes dry-run notice when dryRun is true", () => {
    const summary = { promoted: ["A"], skipped: [], missing: [] };
    const output = formatPromoteResult(summary, true);
    expect(output).toContain("[dry-run]");
  });

  it("shows promoted, skipped, and missing counts", () => {
    const summary = { promoted: ["A", "B"], skipped: ["C"], missing: ["D"] };
    const output = formatPromoteResult(summary, false);
    expect(output).toContain("Promoted (2)");
    expect(output).toContain("Skipped (1)");
    expect(output).toContain("Missing in source (1)");
  });
});

describe("serializeEnvRecord", () => {
  it("serializes a record to .env format", () => {
    const record = { FOO: "bar", BAZ: "qux" };
    const output = serializeEnvRecord(record);
    expect(output).toContain("FOO=bar");
    expect(output).toContain("BAZ=qux");
  });
});

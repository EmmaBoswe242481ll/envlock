import { describe, it, expect } from "vitest";
import {
  parseEnvLines,
  sortAlpha,
  sortGrouped,
  sortEnv,
} from "./sorter";

const sampleEnv = `# App config
ZOOM_KEY=abc
APP_NAME=myapp
DB_HOST=localhost
DB_PORT=5432
AWS_KEY=secret
`;

describe("parseEnvLines", () => {
  it("identifies keys from assignment lines", () => {
    const lines = parseEnvLines("FOO=bar\n# comment\nBAZ=qux");
    expect(lines[0].key).toBe("FOO");
    expect(lines[1].key).toBeNull();
    expect(lines[2].key).toBe("BAZ");
  });

  it("returns null key for blank lines", () => {
    const lines = parseEnvLines("\nFOO=1");
    expect(lines[0].key).toBeNull();
  });
});

describe("sortAlpha", () => {
  it("sorts keys alphabetically", () => {
    const result = sortAlpha(sampleEnv);
    const keys = result
      .split("\n")
      .filter((l) => l.includes("=") && !l.startsWith("#"))
      .map((l) => l.split("=")[0].trim());
    expect(keys).toEqual([...keys].sort());
  });

  it("preserves all key=value pairs", () => {
    const result = sortAlpha(sampleEnv);
    expect(result).toContain("APP_NAME=myapp");
    expect(result).toContain("DB_HOST=localhost");
    expect(result).toContain("ZOOM_KEY=abc");
  });

  it("does not duplicate keys", () => {
    const result = sortAlpha(sampleEnv);
    const matches = result.match(/APP_NAME=/g) ?? [];
    expect(matches.length).toBe(1);
  });
});

describe("sortGrouped", () => {
  it("places keys in specified group order", () => {
    const groups = [["DB_HOST", "DB_PORT"], ["AWS_KEY"], ["APP_NAME"]];
    const result = sortGrouped(sampleEnv, groups);
    const dbIdx = result.indexOf("DB_HOST");
    const awsIdx = result.indexOf("AWS_KEY");
    const appIdx = result.indexOf("APP_NAME");
    expect(dbIdx).toBeLessThan(awsIdx);
    expect(awsIdx).toBeLessThan(appIdx);
  });

  it("appends ungrouped keys at the end", () => {
    const groups = [["DB_HOST"]];
    const result = sortGrouped(sampleEnv, groups);
    const dbIdx = result.indexOf("DB_HOST");
    const zoomIdx = result.indexOf("ZOOM_KEY");
    expect(dbIdx).toBeLessThan(zoomIdx);
  });
});

describe("sortEnv", () => {
  it("returns correct originalCount and sortedCount", () => {
    const { originalCount, sortedCount } = sortEnv(sampleEnv);
    expect(originalCount).toBe(5);
    expect(sortedCount).toBe(5);
  });

  it("defaults to alpha mode", () => {
    const { mode } = sortEnv(sampleEnv);
    expect(mode).toBe("alpha");
  });

  it("uses grouped mode when specified", () => {
    const { mode } = sortEnv(sampleEnv, {
      mode: "grouped",
      groups: [["APP_NAME"]],
    });
    expect(mode).toBe("grouped");
  });

  it("sorted output contains all original keys", () => {
    const { sorted } = sortEnv(sampleEnv);
    expect(sorted).toContain("AWS_KEY=secret");
    expect(sorted).toContain("ZOOM_KEY=abc");
  });
});

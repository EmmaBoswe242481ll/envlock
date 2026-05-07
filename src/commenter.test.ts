import { describe, it, expect } from "bun:test";
import {
  parseWithComments,
  applyComments,
  stripComments,
  formatCommentResult,
} from "./commenter";

const sampleEnv = `# App settings
APP_NAME=MyApp
# Database
DB_HOST=localhost
DB_PORT=5432
API_KEY=secret
`;

describe("parseWithComments", () => {
  it("parses entries with associated comments", () => {
    const entries = parseWithComments(sampleEnv);
    expect(entries.length).toBeGreaterThan(0);
    const appEntry = entries.find((e) => e.key === "APP_NAME");
    expect(appEntry).toBeDefined();
    expect(appEntry?.comment).toBe("App settings");
  });

  it("handles entries without comments", () => {
    const entries = parseWithComments("FOO=bar\nBAZ=qux\n");
    expect(entries.every((e) => !e.comment)).toBe(true);
  });
});

describe("applyComments", () => {
  it("applies comments to matching keys", () => {
    const entries = parseWithComments("DB_HOST=localhost\nAPI_KEY=secret\n");
    const updated = applyComments(entries, {
      DB_HOST: "Database hostname",
      API_KEY: "Third-party API key",
    });
    expect(updated.find((e) => e.key === "DB_HOST")?.comment).toBe(
      "Database hostname"
    );
    expect(updated.find((e) => e.key === "API_KEY")?.comment).toBe(
      "Third-party API key"
    );
  });

  it("ignores keys not present in env", () => {
    const entries = parseWithComments("FOO=bar\n");
    const updated = applyComments(entries, { MISSING: "nope" });
    expect(updated.find((e) => e.key === "MISSING")).toBeUndefined();
  });
});

describe("stripComments", () => {
  it("removes all comments from entries", () => {
    const entries = parseWithComments(sampleEnv);
    const stripped = stripComments(entries);
    expect(stripped.every((e) => !e.comment)).toBe(true);
  });
});

describe("formatCommentResult", () => {
  it("serializes entries with comments", () => {
    const entries = parseWithComments("DB_HOST=localhost\n");
    const withComment = applyComments(entries, { DB_HOST: "The DB host" });
    const output = formatCommentResult(withComment);
    expect(output).toContain("# The DB host");
    expect(output).toContain("DB_HOST=localhost");
  });

  it("serializes entries without comments cleanly", () => {
    const entries = parseWithComments("FOO=bar\n");
    const output = formatCommentResult(stripComments(entries));
    expect(output).toBe("FOO=bar\n");
  });
});

import { describe, it, expect } from "vitest";
import {
  parseWithComments,
  applyComments,
  stripComments,
  formatCommentResult,
} from "./commenter";

const sampleEnv = `# header comment
DB_HOST=localhost # primary db
DB_PORT=5432
API_KEY=secret # keep private
DEBUG=true
`;

describe("parseWithComments", () => {
  it("parses keys with inline comments", () => {
    const records = parseWithComments(sampleEnv);
    const db = records.find((r) => r.key === "DB_HOST");
    expect(db?.value).toBe("localhost");
    expect(db?.comment).toBe("primary db");
  });

  it("returns null comment for lines without inline comment", () => {
    const records = parseWithComments(sampleEnv);
    const port = records.find((r) => r.key === "DB_PORT");
    expect(port?.comment).toBeNull();
  });

  it("skips full-line comments and blank lines", () => {
    const records = parseWithComments(sampleEnv);
    expect(records.every((r) => r.key !== "")).toBe(true);
    expect(records.length).toBe(4);
  });
});

describe("applyComments", () => {
  it("adds comments to specified keys", () => {
    const result = applyComments("DB_PORT=5432\nDEBUG=true", {
      DB_PORT: "tcp port",
    });
    expect(result).toContain("DB_PORT=5432 # tcp port");
    expect(result).toContain("DEBUG=true");
  });

  it("replaces existing inline comment", () => {
    const result = applyComments("API_KEY=secret # old comment", {
      API_KEY: "new comment",
    });
    expect(result).toBe("API_KEY=secret # new comment");
  });

  it("leaves lines without a matching key unchanged", () => {
    const result = applyComments("FOO=bar", {});
    expect(result).toBe("FOO=bar");
  });
});

describe("stripComments", () => {
  it("removes inline comments from all lines", () => {
    const result = stripComments(sampleEnv);
    expect(result).not.toContain("# primary db");
    expect(result).not.toContain("# keep private");
  });

  it("preserves full-line comments", () => {
    const result = stripComments(sampleEnv);
    expect(result).toContain("# header comment");
  });

  it("preserves keys and values", () => {
    const result = stripComments("DB_HOST=localhost # comment");
    expect(result).toBe("DB_HOST=localhost");
  });
});

describe("formatCommentResult", () => {
  it("serialises records with comments", () => {
    const out = formatCommentResult([
      { key: "A", value: "1", comment: "note" },
      { key: "B", value: "2", comment: null },
    ]);
    expect(out).toBe("A=1 # note\nB=2");
  });
});

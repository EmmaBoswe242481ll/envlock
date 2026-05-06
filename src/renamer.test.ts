import { describe, it, expect } from "vitest";
import { applyRenames, parseRenameRules, formatRenameResult } from "./renamer";

const sampleEnv = `# App config
DB_HOST=localhost
DB_PORT=5432
APP_SECRET=supersecret
# End
`;

describe("parseRenameRules", () => {
  it("parses valid rules", () => {
    const rules = parseRenameRules(["DB_HOST:DATABASE_HOST", "APP_SECRET:SECRET_KEY"]);
    expect(rules).toEqual([
      { from: "DB_HOST", to: "DATABASE_HOST" },
      { from: "APP_SECRET", to: "SECRET_KEY" },
    ]);
  });

  it("throws on malformed rule", () => {
    expect(() => parseRenameRules(["INVALID"])).toThrow(
      'Invalid rename rule "INVALID"'
    );
  });

  it("throws on empty key parts", () => {
    expect(() => parseRenameRules([":NEW_KEY"])).toThrow();
  });
});

describe("applyRenames", () => {
  it("renames matching keys", () => {
    const rules = [{ from: "DB_HOST", to: "DATABASE_HOST" }];
    const result = applyRenames(sampleEnv, rules);
    expect(result.renamed).toHaveLength(1);
    expect(result.renamed[0]).toEqual({ from: "DB_HOST", to: "DATABASE_HOST" });
    expect(result.output).toContain("DATABASE_HOST=localhost");
    expect(result.output).not.toContain("DB_HOST=localhost");
  });

  it("preserves comments and unmatched lines", () => {
    const rules = [{ from: "DB_HOST", to: "DATABASE_HOST" }];
    const result = applyRenames(sampleEnv, rules);
    expect(result.output).toContain("# App config");
    expect(result.output).toContain("DB_PORT=5432");
  });

  it("tracks not-found keys", () => {
    const rules = [{ from: "MISSING_KEY", to: "NEW_KEY" }];
    const result = applyRenames(sampleEnv, rules);
    expect(result.notFound).toContain("MISSING_KEY");
    expect(result.renamed).toHaveLength(0);
  });

  it("renames multiple keys in one pass", () => {
    const rules = [
      { from: "DB_HOST", to: "DATABASE_HOST" },
      { from: "DB_PORT", to: "DATABASE_PORT" },
    ];
    const result = applyRenames(sampleEnv, rules);
    expect(result.renamed).toHaveLength(2);
    expect(result.output).toContain("DATABASE_HOST=localhost");
    expect(result.output).toContain("DATABASE_PORT=5432");
  });
});

describe("formatRenameResult", () => {
  it("formats renamed and not-found keys", () => {
    const result = {
      renamed: [{ from: "OLD", to: "NEW" }],
      notFound: ["MISSING"],
      output: "",
    };
    const text = formatRenameResult(result);
    expect(text).toContain("OLD → NEW");
    expect(text).toContain("MISSING");
  });

  it("shows fallback when no rules applied", () => {
    const result = { renamed: [], notFound: [], output: "" };
    expect(formatRenameResult(result)).toContain("No rules applied.");
  });
});

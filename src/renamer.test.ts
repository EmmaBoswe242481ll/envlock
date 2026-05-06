import { applyRenames, parseRenameRules, formatRenameResult } from "./renamer";

describe("parseRenameRules", () => {
  it("parses simple OLD=NEW rules", () => {
    const rules = parseRenameRules(["OLD_KEY=NEW_KEY", "FOO=BAR"]);
    expect(rules).toEqual({ OLD_KEY: "NEW_KEY", FOO: "BAR" });
  });

  it("ignores malformed rules", () => {
    const rules = parseRenameRules(["INVALID", "GOOD=BETTER"]);
    expect(rules).toEqual({ GOOD: "BETTER" });
  });

  it("handles empty array", () => {
    expect(parseRenameRules([])).toEqual({});
  });
});

describe("applyRenames", () => {
  it("renames matching keys", () => {
    const record = { OLD_KEY: "value", KEEP: "same" };
    const rules = { OLD_KEY: "NEW_KEY" };
    const result = applyRenames(record, rules);
    expect(result.renamed).toHaveProperty("NEW_KEY", "value");
    expect(result.renamed).toHaveProperty("KEEP", "same");
    expect(result.renamed).not.toHaveProperty("OLD_KEY");
  });

  it("tracks applied and skipped renames", () => {
    const record = { A: "1" };
    const rules = { A: "B", MISSING: "X" };
    const result = applyRenames(record, rules);
    expect(result.applied).toContainEqual({ from: "A", to: "B" });
    expect(result.skipped).toContainEqual({ from: "MISSING", to: "X", reason: "key not found" });
  });

  it("skips rename if target key already exists", () => {
    const record = { OLD: "1", NEW: "existing" };
    const rules = { OLD: "NEW" };
    const result = applyRenames(record, rules);
    expect(result.skipped).toContainEqual({ from: "OLD", to: "NEW", reason: "target key already exists" });
    expect(result.renamed).toHaveProperty("OLD", "1");
  });

  it("returns unchanged record when no rules match", () => {
    const record = { FOO: "bar" };
    const result = applyRenames(record, {});
    expect(result.renamed).toEqual({ FOO: "bar" });
    expect(result.applied).toHaveLength(0);
  });
});

describe("formatRenameResult", () => {
  it("formats applied renames", () => {
    const result = {
      renamed: { NEW_KEY: "val" },
      applied: [{ from: "OLD_KEY", to: "NEW_KEY" }],
      skipped: [],
    };
    const output = formatRenameResult(result);
    expect(output).toContain("OLD_KEY");
    expect(output).toContain("NEW_KEY");
  });

  it("formats skipped renames with reason", () => {
    const result = {
      renamed: {},
      applied: [],
      skipped: [{ from: "MISSING", to: "X", reason: "key not found" }],
    };
    const output = formatRenameResult(result);
    expect(output).toContain("MISSING");
    expect(output).toContain("key not found");
  });

  it("shows summary counts", () => {
    const result = {
      renamed: { B: "1" },
      applied: [{ from: "A", to: "B" }],
      skipped: [],
    };
    const output = formatRenameResult(result);
    expect(output).toMatch(/1 rename/);
  });
});

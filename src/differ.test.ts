import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  parseEnvToRecord,
  diffEnvRecords,
  compareEnvFiles,
  formatDiffResult,
} from "./differ";

function writeTempEnv(content: string): string {
  const filePath = path.join(os.tmpdir(), `differ-test-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvToRecord", () => {
  it("parses basic key=value pairs", () => {
    const result = parseEnvToRecord("FOO=bar\nBAZ=qux");
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("ignores comments and blank lines", () => {
    const result = parseEnvToRecord("# comment\n\nFOO=bar");
    expect(result).toEqual({ FOO: "bar" });
  });

  it("strips surrounding quotes from values", () => {
    const result = parseEnvToRecord('KEY="hello world"');
    expect(result).toEqual({ KEY: "hello world" });
  });

  it("handles values with equals signs", () => {
    const result = parseEnvToRecord("URL=http://example.com?a=1");
    expect(result["URL"]).toBe("http://example.com?a=1");
  });
});

describe("diffEnvRecords", () => {
  it("detects added keys", () => {
    const diff = diffEnvRecords({ A: "1" }, { A: "1", B: "2" });
    expect(diff.added).toContain("B");
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it("detects removed keys", () => {
    const diff = diffEnvRecords({ A: "1", B: "2" }, { A: "1" });
    expect(diff.removed).toContain("B");
    expect(diff.added).toHaveLength(0);
  });

  it("detects changed values", () => {
    const diff = diffEnvRecords({ A: "old" }, { A: "new" });
    expect(diff.changed).toContain("A");
  });

  it("returns empty diff for identical records", () => {
    const diff = diffEnvRecords({ A: "1" }, { A: "1" });
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });
});

describe("compareEnvFiles", () => {
  it("compares two env files on disk", () => {
    const before = writeTempEnv("FOO=1\nBAR=2");
    const after = writeTempEnv("FOO=1\nBAZ=3");
    const diff = compareEnvFiles(before, after);
    expect(diff.added).toContain("BAZ");
    expect(diff.removed).toContain("BAR");
    fs.unlinkSync(before);
    fs.unlinkSync(after);
  });

  it("throws if a file does not exist", () => {
    expect(() => compareEnvFiles("/nonexistent/.env", "/also/none")).toThrow();
  });
});

describe("formatDiffResult", () => {
  it("formats a diff with all change types", () => {
    const result = formatDiffResult({ added: ["X"], removed: ["Y"], changed: ["Z"] });
    expect(result).toMatch(/Added/);
    expect(result).toMatch(/Removed/);
    expect(result).toMatch(/Changed/);
  });

  it("returns no-diff message when empty", () => {
    const result = formatDiffResult({ added: [], removed: [], changed: [] });
    expect(result).toBe("No differences found.");
  });
});

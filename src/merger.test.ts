import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { mergeRecords, mergeEnvFiles, formatMergeResult } from "./merger";

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `test-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(file, content);
  return file;
}

describe("mergeRecords", () => {
  it("merges non-conflicting records", () => {
    const result = mergeRecords([
      { source: "a", data: { FOO: "1" } },
      { source: "b", data: { BAR: "2" } },
    ]);
    expect(result.merged).toEqual({ FOO: "1", BAR: "2" });
    expect(result.conflicts).toHaveLength(0);
  });

  it("last-wins on conflict", () => {
    const result = mergeRecords([
      { source: "a", data: { FOO: "old" } },
      { source: "b", data: { FOO: "new" } },
    ], "last-wins");
    expect(result.merged.FOO).toBe("new");
    expect(result.conflicts).toHaveLength(1);
  });

  it("first-wins on conflict", () => {
    const result = mergeRecords([
      { source: "a", data: { FOO: "first" } },
      { source: "b", data: { FOO: "second" } },
    ], "first-wins");
    expect(result.merged.FOO).toBe("first");
  });

  it("error-on-conflict throws", () => {
    expect(() =>
      mergeRecords([
        { source: "a", data: { FOO: "x" } },
        { source: "b", data: { FOO: "y" } },
      ], "error-on-conflict")
    ).toThrow(/Conflict on key "FOO"/);
  });
});

describe("mergeEnvFiles", () => {
  it("merges two env files", () => {
    const f1 = writeTempEnv("A=1\nB=2");
    const f2 = writeTempEnv("B=3\nC=4");
    const result = mergeEnvFiles([f1, f2], { strategy: "last-wins" });
    expect(result.merged).toMatchObject({ A: "1", B: "3", C: "4" });
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });
});

describe("formatMergeResult", () => {
  it("formats merged record as dotenv", () => {
    const result = { merged: { A: "1", B: "2" }, conflicts: [], sources: [] };
    const output = formatMergeResult(result);
    expect(output).toContain("A=1");
    expect(output).toContain("B=2");
  });
});

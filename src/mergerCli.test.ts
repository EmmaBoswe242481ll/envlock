import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseMergeArgs, runMerger } from "./mergerCli";

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `merge-cli-${Date.now()}-${Math.random()}.env`);
  fs.writeFileSync(file, content);
  return file;
}

describe("parseMergeArgs", () => {
  it("parses file arguments", () => {
    const result = parseMergeArgs(["node", "script", ".env", ".env.local"]);
    expect(result.files).toEqual([".env", ".env.local"]);
    expect(result.strategy).toBe("last-wins");
  });

  it("parses --strategy flag", () => {
    const result = parseMergeArgs(["node", "script", "a.env", "--strategy", "first-wins"]);
    expect(result.strategy).toBe("first-wins");
  });

  it("parses --output flag", () => {
    const result = parseMergeArgs(["node", "script", "a.env", "--output", "merged.env"]);
    expect(result.output).toBe("merged.env");
  });

  it("parses --show-conflicts flag", () => {
    const result = parseMergeArgs(["node", "script", "a.env", "--show-conflicts"]);
    expect(result.showConflicts).toBe(true);
  });
});

describe("runMerger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("prints merged output to stdout", () => {
    const f1 = writeTempEnv("A=1");
    const f2 = writeTempEnv("B=2");
    runMerger(["node", "script", f1, f2]);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("A=1"));
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
  });

  it("writes to output file when --output provided", () => {
    const f1 = writeTempEnv("X=hello");
    const f2 = writeTempEnv("Y=world");
    const out = path.join(os.tmpdir(), `merged-${Date.now()}.env`);
    runMerger(["node", "script", f1, f2, "--output", out]);
    const written = fs.readFileSync(out, "utf-8");
    expect(written).toContain("X=hello");
    fs.unlinkSync(f1);
    fs.unlinkSync(f2);
    fs.unlinkSync(out);
  });

  it("exits with error when fewer than 2 files", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runMerger(["node", "script", "only-one.env"])).toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

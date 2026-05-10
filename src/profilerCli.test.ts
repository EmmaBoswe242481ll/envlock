import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { parseProfilerArgs, runProfiler } from "./profilerCli";

const TMP = join(__dirname, "__tmp_profiler_cli");

function writeTempEnv(content: string): string {
  const path = `${TMP}_${Date.now()}.env`;
  writeFileSync(path, content, "utf-8");
  return path;
}

const created: string[] = [];

beforeEach(() => created.splice(0));
aftereEach(() => {
  for (const f of created) if (existsSync(f)) unlinkSync(f);
});

describe("parseProfilerArgs", () => {
  it("defaults to .env and text output", () => {
    const args = parseProfilerArgs([]);
    expect(args.file).toBe(".env");
    expect(args.output).toBe("text");
  });

  it("parses --file flag", () => {
    const args = parseProfilerArgs(["--file", "prod.env"]);
    expect(args.file).toBe("prod.env");
  });

  it("parses -f shorthand", () => {
    const args = parseProfilerArgs(["-f", "staging.env"]);
    expect(args.file).toBe("staging.env");
  });

  it("parses --json flag", () => {
    const args = parseProfilerArgs(["--json"]);
    expect(args.output).toBe("json");
  });

  it("parses --min-length and --max-length", () => {
    const args = parseProfilerArgs(["--min-length", "4", "--max-length", "64"]);
    expect(args.minLength).toBe(4);
    expect(args.maxLength).toBe(64);
  });

  it("treats bare argument as file", () => {
    const args = parseProfilerArgs(["custom.env"]);
    expect(args.file).toBe("custom.env");
  });
});

describe("runProfiler", () => {
  it("outputs text report for valid env file", async () => {
    const path = writeTempEnv("API_KEY=abc123\nDEBUG=true\n");
    created.push(path);

    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);

    await runProfiler([path]);
    console.log = orig;

    expect(logs.join("\n")).toMatch(/API_KEY|DEBUG/);
  });

  it("outputs json when --json flag is set", async () => {
    const path = writeTempEnv("PORT=3000\nHOST=localhost\n");
    created.push(path);

    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);

    await runProfiler(["--json", path]);
    console.log = orig;

    const parsed = JSON.parse(logs[0]);
    expect(parsed).toBeDefined();
  });
});

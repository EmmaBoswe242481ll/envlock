import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parseMaskArgs, runMasker } from "./maskerCli";

function writeTempEnv(content: string): string {
  const path = join(tmpdir(), `masker-cli-test-${Date.now()}.env`);
  writeFileSync(path, content, "utf-8");
  return path;
}

const tmpFiles: string[] = [];

beforeEach(() => tmpFiles.splice(0));
afterEach(() => {
  for (const f of tmpFiles) {
    if (existsSync(f)) unlinkSync(f);
  }
});

describe("parseMaskArgs", () => {
  it("returns defaults when no args given", () => {
    const args = parseMaskArgs([]);
    expect(args.input).toBe(".env");
    expect(args.format).toBe("text");
    expect(args.visibleChars).toBe(2);
    expect(args.maskChar).toBe("*");
    expect(args.output).toBeUndefined();
  });

  it("parses --input and --output", () => {
    const args = parseMaskArgs(["--input", "prod.env", "--output", "out.env"]);
    expect(args.input).toBe("prod.env");
    expect(args.output).toBe("out.env");
  });

  it("parses --format json", () => {
    const args = parseMaskArgs(["--format", "json"]);
    expect(args.format).toBe("json");
  });

  it("parses --visible and --char", () => {
    const args = parseMaskArgs(["--visible", "4", "--char", "#"]);
    expect(args.visibleChars).toBe(4);
    expect(args.maskChar).toBe("#");
  });

  it("supports -i shorthand", () => {
    const args = parseMaskArgs(["-i", "staging.env"]);
    expect(args.input).toBe("staging.env");
  });
});

describe("runMasker", () => {
  it("prints masked output to stdout", () => {
    const file = writeTempEnv("API_KEY=supersecret\nPORT=3000\n");
    tmpFiles.push(file);

    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);

    runMasker(["--input", file]);
    console.log = orig;

    expect(logs.join("\n")).toContain("API_KEY");
  });

  it("writes output to file when --output is given", () => {
    const file = writeTempEnv("SECRET=abc123\n");
    const outFile = join(tmpdir(), `masker-out-${Date.now()}.txt`);
    tmpFiles.push(file, outFile);

    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);

    runMasker(["--input", file, "--output", outFile]);
    console.log = orig;

    expect(existsSync(outFile)).toBe(true);
    expect(logs[0]).toContain(outFile);
  });

  it("exits with error on missing file", () => {
    const errors: string[] = [];
    const origErr = console.error;
    console.error = (msg: string) => errors.push(msg);
    const origExit = process.exit;
    let exitCode = 0;
    process.exit = ((code: number) => { exitCode = code; }) as never;

    runMasker(["--input", "/nonexistent/path.env"]);

    console.error = origErr;
    process.exit = origExit;

    expect(exitCode).toBe(1);
    expect(errors[0]).toContain("Could not read");
  });
});

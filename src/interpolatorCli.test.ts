import { describe, it, expect, vi } from "vitest";
import { writeFileSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  parseInterpolateArgs,
  formatOutput,
  runInterpolator,
} from "./interpolatorCli";

function writeTempEnv(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "envlock-interp-"));
  const file = join(dir, ".env");
  writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseInterpolateArgs", () => {
  it("defaults to .env and dotenv format", () => {
    const args = parseInterpolateArgs(["node", "script"]);
    expect(args).toEqual({ envFile: ".env", format: "dotenv", strict: false });
  });

  it("parses custom file and json flag", () => {
    const args = parseInterpolateArgs(["node", "script", "prod.env", "--json"]);
    expect(args.envFile).toBe("prod.env");
    expect(args.format).toBe("json");
  });

  it("parses --strict flag", () => {
    const args = parseInterpolateArgs(["node", "script", "--strict"]);
    expect(args.strict).toBe(true);
  });
});

describe("formatOutput", () => {
  const record = { FOO: "bar", URL: "http://localhost" };

  it("formats as dotenv", () => {
    const out = formatOutput(record, "dotenv");
    expect(out).toContain("FOO=bar");
    expect(out).toContain("URL=http://localhost");
  });

  it("formats as json", () => {
    const out = formatOutput(record, "json");
    const parsed = JSON.parse(out);
    expect(parsed.FOO).toBe("bar");
  });
});

describe("runInterpolator", () => {
  it("resolves and prints interpolated env", () => {
    const file = writeTempEnv("HOST=localhost\nURL=http://${HOST}:3000");
    const log = vi.fn();
    const code = runInterpolator(["node", "script", file], log, vi.fn());
    expect(code).toBe(0);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("http://localhost:3000"));
  });

  it("returns 1 for missing file", () => {
    const err = vi.fn();
    const code = runInterpolator(["node", "script", "/no/such.env"], vi.fn(), err);
    expect(code).toBe(1);
    expect(err).toHaveBeenCalled();
  });

  it("returns 1 in strict mode with unresolved refs", () => {
    const file = writeTempEnv("URL=http://${MISSING_HOST}");
    const err = vi.fn();
    const code = runInterpolator(["node", "script", file, "--strict"], vi.fn(), err);
    expect(code).toBe(1);
    expect(err).toHaveBeenCalledWith(expect.stringContaining("MISSING_HOST"));
  });

  it("outputs json when --json flag provided", () => {
    const file = writeTempEnv("KEY=value");
    const log = vi.fn();
    runInterpolator(["node", "script", file, "--json"], log, vi.fn());
    const output = log.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
  });
});

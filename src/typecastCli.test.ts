import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parseTypecastArgs, runTypecast } from "./typecastCli";

function writeTempEnv(content: string): string {
  const p = join(tmpdir(), `typecast-cli-${Date.now()}.env`);
  writeFileSync(p, content, "utf-8");
  return p;
}

describe("parseTypecastArgs", () => {
  it("returns defaults", () => {
    const args = parseTypecastArgs([]);
    expect(args.input).toBe(".env");
    expect(args.format).toBe("text");
    expect(args.apply).toBe(false);
    expect(args.output).toBeUndefined();
  });

  it("parses --input and --output", () => {
    const args = parseTypecastArgs(["--input", "a.env", "--output", "b.env"]);
    expect(args.input).toBe("a.env");
    expect(args.output).toBe("b.env");
  });

  it("parses --json flag", () => {
    const args = parseTypecastArgs(["--json"]);
    expect(args.format).toBe("json");
  });

  it("parses --apply flag", () => {
    const args = parseTypecastArgs(["--apply"]);
    expect(args.apply).toBe(true);
  });

  it("parses short flags -i and -o", () => {
    const args = parseTypecastArgs(["-i", "x.env", "-o", "y.env"]);
    expect(args.input).toBe("x.env");
    expect(args.output).toBe("y.env");
  });
});

describe("runTypecast", () => {
  let tmpFile: string;
  let outFile: string;

  beforeEach(() => {
    tmpFile = writeTempEnv("PORT=3000\nDEBUG=true\nNAME=app\n");
    outFile = join(tmpdir(), `typecast-out-${Date.now()}.env`);
  });

  afterEach(() => {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
    if (existsSync(outFile)) unlinkSync(outFile);
  });

  it("prints text report without error", () => {
    expect(() => runTypecast(["--input", tmpFile])).not.toThrow();
  });

  it("prints json output with --json flag", () => {
    const logs: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => logs.push(msg);
    runTypecast(["--input", tmpFile, "--json"]);
    console.log = orig;
    const parsed = JSON.parse(logs[0]);
    expect(parsed.PORT).toBe(3000);
    expect(parsed.DEBUG).toBe(true);
    expect(parsed.NAME).toBe("app");
  });

  it("writes output file when --apply and --output provided", () => {
    runTypecast(["--input", tmpFile, "--apply", "--output", outFile]);
    expect(existsSync(outFile)).toBe(true);
  });

  it("exits on missing input file", () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runTypecast(["--input", "/nonexistent/path.env"])).toThrow("exit");
    mockExit.mockRestore();
  });
});

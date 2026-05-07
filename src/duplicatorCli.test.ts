import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseDuplicateArgs, runDuplicator } from "./duplicatorCli";

function writeTempEnv(content: string): string {
  const filePath = path.join(os.tmpdir(), `test-${Date.now()}.env`);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseDuplicateArgs", () => {
  it("parses file path", () => {
    const args = parseDuplicateArgs(["node", "duplicatorCli", ".env"]);
    expect(args.filePath).toBe(".env");
    expect(args.checkValues).toBe(false);
    expect(args.json).toBe(false);
  });

  it("parses --values flag", () => {
    const args = parseDuplicateArgs(["node", "duplicatorCli", ".env", "--values"]);
    expect(args.checkValues).toBe(true);
  });

  it("parses --json flag", () => {
    const args = parseDuplicateArgs(["node", "duplicatorCli", ".env", "--json"]);
    expect(args.json).toBe(true);
  });

  it("exits if no file path provided", () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => parseDuplicateArgs(["node", "duplicatorCli"])).toThrow("exit");
    mockExit.mockRestore();
  });
});

describe("runDuplicator", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("exits with 0 when no duplicates found", () => {
    const file = writeTempEnv("FOO=bar\nBAZ=qux\n");
    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    expect(() => runDuplicator(["node", "duplicatorCli", file])).not.toThrow();
    mockExit.mockRestore();
    fs.unlinkSync(file);
  });

  it("exits with 1 when duplicate keys found", () => {
    const file = writeTempEnv("FOO=bar\nFOO=baz\n");
    const mockExit = jest.spyOn(process, "exit").mockImplementation((code) => { throw new Error(`exit:${code}`); });
    expect(() => runDuplicator(["node", "duplicatorCli", file])).toThrow("exit:1");
    mockExit.mockRestore();
    fs.unlinkSync(file);
  });

  it("outputs json when --json flag is set", () => {
    const file = writeTempEnv("FOO=bar\nBAZ=qux\n");
    runDuplicator(["node", "duplicatorCli", file, "--json"]);
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty("duplicateKeys");
    expect(parsed).toHaveProperty("hasDuplicates");
    fs.unlinkSync(file);
  });

  it("exits with 1 if file not found", () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation((code) => { throw new Error(`exit:${code}`); });
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => runDuplicator(["node", "duplicatorCli", "/nonexistent/file.env"])).toThrow("exit:1");
    mockExit.mockRestore();
  });
});

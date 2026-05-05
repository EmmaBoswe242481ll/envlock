import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseSortArgs, runSorter } from "./sorterCli";

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `envlock-sorter-cli-${Date.now()}.env`);
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseSortArgs", () => {
  it("parses input file", () => {
    const args = parseSortArgs(["node", "sorterCli.js", ".env"]);
    expect(args.input).toBe(".env");
    expect(args.mode).toBe("alpha");
    expect(args.inPlace).toBe(false);
  });

  it("parses --mode grouped", () => {
    const args = parseSortArgs(["node", "sorterCli.js", ".env", "--mode", "grouped"]);
    expect(args.mode).toBe("grouped");
  });

  it("parses --output flag", () => {
    const args = parseSortArgs(["node", "sorterCli.js", ".env", "--output", "out.env"]);
    expect(args.output).toBe("out.env");
  });

  it("parses --in-place flag", () => {
    const args = parseSortArgs(["node", "sorterCli.js", ".env", "--in-place"]);
    expect(args.inPlace).toBe(true);
  });

  it("throws on missing input", () => {
    expect(() => parseSortArgs(["node", "sorterCli.js"])).toThrow("Input file is required.");
  });

  it("throws on invalid mode", () => {
    expect(() =>
      parseSortArgs(["node", "sorterCli.js", ".env", "--mode", "random"])
    ).toThrow('Invalid mode "random"');
  });
});

describe("runSorter", () => {
  it("writes sorted output to stdout", () => {
    const file = writeTempEnv("ZEBRA=1\nAPPLE=2\nMANGO=3\n");
    const written: string[] = [];
    const origWrite = process.stdout.write.bind(process.stdout);
    jest.spyOn(process.stdout, "write").mockImplementation((chunk: any) => {
      written.push(chunk);
      return true;
    });

    runSorter(["node", "sorterCli.js", file]);

    expect(written.join("")).toContain("APPLE=2");
    jest.restoreAllMocks();
    fs.unlinkSync(file);
  });

  it("writes sorted output to --output file", () => {
    const file = writeTempEnv("ZEBRA=1\nAPPLE=2\n");
    const outFile = path.join(os.tmpdir(), `envlock-sorter-out-${Date.now()}.env`);

    runSorter(["node", "sorterCli.js", file, "--output", outFile]);

    const result = fs.readFileSync(outFile, "utf-8");
    expect(result.indexOf("APPLE")).toBeLessThan(result.indexOf("ZEBRA"));

    fs.unlinkSync(file);
    fs.unlinkSync(outFile);
  });

  it("sorts in place with --in-place", () => {
    const file = writeTempEnv("ZEBRA=1\nAPPLE=2\n");

    runSorter(["node", "sorterCli.js", file, "--in-place"]);

    const result = fs.readFileSync(file, "utf-8");
    expect(result.indexOf("APPLE")).toBeLessThan(result.indexOf("ZEBRA"));

    fs.unlinkSync(file);
  });

  it("exits with error for missing file", () => {
    const mockExit = jest.spyOn(process, "exit").mockImplementation((code?: any) => { throw new Error(`exit:${code}`); });
    const mockErr = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      runSorter(["node", "sorterCli.js", "/nonexistent/.env"])
    ).toThrow("exit:1");

    mockExit.mockRestore();
    mockErr.mockRestore();
  });
});

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseRenamerArgs, runRenamer } from "./renamerCli";

function writeTempEnv(content: string): string {
  const file = path.join(os.tmpdir(), `envlock-renamer-${Date.now()}.env`);
  fs.writeFileSync(file, content, "utf-8");
  return file;
}

describe("parseRenamerArgs", () => {
  it("parses --input and --rule flags", () => {
    const args = parseRenamerArgs(["--input", ".env", "--rule", "OLD=NEW"]);
    expect(args.inputFile).toBe(".env");
    expect(args.rules).toEqual(["OLD=NEW"]);
    expect(args.dryRun).toBe(false);
  });

  it("parses --dry-run flag", () => {
    const args = parseRenamerArgs(["--input", ".env", "--dry-run"]);
    expect(args.dryRun).toBe(true);
  });

  it("parses short flags -i and -o", () => {
    const args = parseRenamerArgs(["-i", ".env", "-o", "out.env"]);
    expect(args.inputFile).toBe(".env");
    expect(args.outputFile).toBe("out.env");
  });

  it("parses multiple --rule flags", () => {
    const args = parseRenamerArgs(["--input", ".env", "--rule", "A=B", "--rule", "C=D"]);
    expect(args.rules).toEqual(["A=B", "C=D"]);
  });
});

describe("runRenamer", () => {
  it("renames keys and writes output in dry-run mode", async () => {
    const input = writeTempEnv("OLD_KEY=hello\nOTHER=world\n");
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runRenamer(["--input", input, "--rule", "OLD_KEY=NEW_KEY", "--dry-run"]);

    const content = fs.readFileSync(input, "utf-8");
    expect(content).toContain("OLD_KEY=hello");
    spy.mockRestore();
    fs.unlinkSync(input);
  });

  it("renames keys and writes output file", async () => {
    const input = writeTempEnv("OLD_KEY=hello\nOTHER=world\n");
    const output = path.join(os.tmpdir(), `envlock-renamed-${Date.now()}.env`);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runRenamer(["--input", input, "--rule", "OLD_KEY=NEW_KEY", "--output", output]);

    const content = fs.readFileSync(output, "utf-8");
    expect(content).toContain("NEW_KEY=hello");
    expect(content).toContain("OTHER=world");
    spy.mockRestore();
    fs.unlinkSync(input);
    fs.unlinkSync(output);
  });

  it("loads rules from a rules file", async () => {
    const input = writeTempEnv("FOO=bar\nBAZ=qux\n");
    const rulesFile = writeTempEnv("FOO=NEW_FOO\nBAZ=NEW_BAZ");
    const output = path.join(os.tmpdir(), `envlock-renamed-${Date.now()}.env`);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runRenamer(["--input", input, "--rules-file", rulesFile, "--output", output]);

    const content = fs.readFileSync(output, "utf-8");
    expect(content).toContain("NEW_FOO=bar");
    expect(content).toContain("NEW_BAZ=qux");
    spy.mockRestore();
    fs.unlinkSync(input);
    fs.unlinkSync(rulesFile);
    fs.unlinkSync(output);
  });
});

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  parseEnvContent,
  loadEnvFile,
  mergeEnvFiles,
  EnvLoadError,
} from "./loader";

function writeTempEnv(content: string): string {
  const filePath = path.join(os.tmpdir(), `envlock-test-${Date.now()}.env`);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvContent", () => {
  it("parses simple key=value pairs", () => {
    const result = parseEnvContent("FOO=bar\nBAZ=qux");
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("ignores comments and blank lines", () => {
    const result = parseEnvContent("# comment\n\nFOO=bar");
    expect(result).toEqual({ FOO: "bar" });
  });

  it("strips double quotes from values", () => {
    const result = parseEnvContent('KEY="hello world"');
    expect(result).toEqual({ KEY: "hello world" });
  });

  it("strips single quotes from values", () => {
    const result = parseEnvContent("KEY='hello world'");
    expect(result).toEqual({ KEY: "hello world" });
  });

  it("handles empty values", () => {
    const result = parseEnvContent("EMPTY=");
    expect(result).toEqual({ EMPTY: "" });
  });

  it("ignores lines without an equals sign", () => {
    const result = parseEnvContent("NOEQUALSSIGN\nFOO=bar");
    expect(result).toEqual({ FOO: "bar" });
  });

  it("handles Windows-style line endings", () => {
    const result = parseEnvContent("FOO=bar\r\nBAZ=qux");
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("handles values containing equals signs", () => {
    const result = parseEnvContent("URL=http://example.com?foo=bar&baz=qux");
    expect(result).toEqual({ URL: "http://example.com?foo=bar&baz=qux" });
  });
});

describe("loadEnvFile", () => {
  it("loads and parses an existing env file", () => {
    const filePath = writeTempEnv("HOST=localhost\nPORT=3000");
    const { vars } = loadEnvFile(filePath);
    expect(vars).toEqual({ HOST: "localhost", PORT: "3000" });
    fs.unlinkSync(filePath);
  });

  it("throws EnvLoadError for missing file", () => {
    expect(() => loadEnvFile("/nonexistent/.env")).toThrow(EnvLoadError);
  });

  it("includes the missing file path in the error message", () => {
    const missingPath = "/nonexistent/.env";
    expect(() => loadEnvFile(missingPath)).toThrow(missingPath);
  });

  it("returns the resolved file path", () => {
    const filePath = writeTempEnv("A=1");
    const { filePath: resolved } = loadEnvFile(filePath);
    expect(path.isAbsolute(resolved)).toBe(true);
    fs.unlinkSync(filePath);
  });
});

describe("mergeEnvFiles", () => {
  it("merges multiple env files with later files taking precedence", () => {
    const file1 = writeTempEnv("FOO=first\nBAR=base");
    const file2 = writeTempEnv("FOO=second\nBAZ=extra");
    const { vars } = mergeEnvFiles([file1, file2]);
    expect(vars).toEqual({ FOO: "second", BAR: "base", BAZ: "extra" });
    fs.unlinkSync(file1);
    fs.unlinkSync(file2);
  });
});

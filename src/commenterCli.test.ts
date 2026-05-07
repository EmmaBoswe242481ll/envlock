import { describe, it, expect } from "bun:test";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parseCommentArgs, runCommenter } from "./commenterCli";

function writeTempFile(name: string, content: string): string {
  const dir = join(tmpdir(), "envlock-commenter-test");
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, name);
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseCommentArgs", () => {
  it("parses --env and --strip", () => {
    const args = parseCommentArgs(["--env", ".env.test", "--strip"]);
    expect(args.env).toBe(".env.test");
    expect(args.strip).toBe(true);
  });

  it("parses --comments and --output", () => {
    const args = parseCommentArgs([
      "--comments",
      "c.json",
      "--output",
      "out.env",
    ]);
    expect(args.comments).toBe("c.json");
    expect(args.output).toBe("out.env");
  });

  it("defaults strip to false", () => {
    const args = parseCommentArgs([]);
    expect(args.strip).toBe(false);
  });
});

describe("runCommenter", () => {
  it("strips comments and writes output", () => {
    const envFile = writeTempFile(
      "strip.env",
      "# Host\nDB_HOST=localhost\n"
    );
    const outFile = writeTempFile("strip.out.env", "");
    runCommenter(["--env", envFile, "--strip", "--output", outFile]);
    const result = readFileSync(outFile, "utf-8");
    expect(result).not.toContain("#");
    expect(result).toContain("DB_HOST=localhost");
  });

  it("applies comments from JSON and writes output", () => {
    const envFile = writeTempFile("comment.env", "API_KEY=secret\n");
    const commentsFile = writeTempFile(
      "comments.json",
      JSON.stringify({ API_KEY: "Your API key" })
    );
    const outFile = writeTempFile("comment.out.env", "");
    runCommenter([
      "--env",
      envFile,
      "--comments",
      commentsFile,
      "--output",
      outFile,
    ]);
    const result = readFileSync(outFile, "utf-8");
    expect(result).toContain("# Your API key");
    expect(result).toContain("API_KEY=secret");
  });
});

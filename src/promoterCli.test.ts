import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parsePromoteArgs, loadTemplateKeys, runPromoter } from "./promoterCli";
import { readFileSync } from "fs";

function writeTempEnv(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "promoter-"));
  const file = join(dir, ".env");
  writeFileSync(file, content, "utf-8");
  return file;
}

describe("parsePromoteArgs", () => {
  it("parses --source, --target, --template flags", () => {
    const args = parsePromoteArgs(["--source", "a.env", "--target", "b.env", "--template", "t.env"]);
    expect(args.source).toBe("a.env");
    expect(args.target).toBe("b.env");
    expect(args.template).toBe("t.env");
  });

  it("defaults overwrite and dryRun to false", () => {
    const args = parsePromoteArgs([]);
    expect(args.overwrite).toBe(false);
    expect(args.dryRun).toBe(false);
  });

  it("sets overwrite when --overwrite flag is present", () => {
    const args = parsePromoteArgs(["--overwrite"]);
    expect(args.overwrite).toBe(true);
  });

  it("sets dryRun when --dry-run flag is present", () => {
    const args = parsePromoteArgs(["--dry-run"]);
    expect(args.dryRun).toBe(true);
  });
});

describe("loadTemplateKeys", () => {
  it("returns keys from a template env file", () => {
    const file = writeTempEnv("DB_URL=\nAPI_KEY=\nPORT=");
    const keys = loadTemplateKeys(file);
    expect(keys).toContain("DB_URL");
    expect(keys).toContain("API_KEY");
    expect(keys).toContain("PORT");
  });

  it("throws if template file does not exist", () => {
    expect(() => loadTemplateKeys("/nonexistent/.env")).toThrow("Template file not found");
  });
});

describe("runPromoter", () => {
  it("promotes values from source into target based on template", async () => {
    const source = writeTempEnv("DB_HOST=staging-db\nAPI_KEY=stg-key\nSECRET=hidden");
    const target = writeTempEnv("DB_HOST=prod-db\nPORT=443");
    const template = writeTempEnv("DB_HOST=\nAPI_KEY=");

    await runPromoter(["--source", source, "--target", target, "--template", template, "--overwrite"]);

    const written = readFileSync(target, "utf-8");
    expect(written).toContain("DB_HOST=staging-db");
    expect(written).toContain("API_KEY=stg-key");
    expect(written).toContain("PORT=443");
  });

  it("does not write file in dry-run mode", async () => {
    const source = writeTempEnv("NEW_KEY=value");
    const target = writeTempEnv("EXISTING=keep");
    const template = writeTempEnv("NEW_KEY=");

    await runPromoter(["--source", source, "--target", target, "--template", template, "--dry-run"]);

    const written = readFileSync(target, "utf-8");
    expect(written).not.toContain("NEW_KEY");
  });
});

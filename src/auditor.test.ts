import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { auditEnv, formatAuditResult, loadSchema } from "./auditor";

function writeTempFile(name: string, content: string): string {
  const filePath = path.join(os.tmpdir(), name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

const schemaContent = JSON.stringify({
  API_KEY: { required: true, type: "string" },
  PORT: { required: true, type: "number" },
  DEBUG: { required: false, type: "boolean" },
});

describe("loadSchema", () => {
  it("loads and parses a valid schema JSON file", () => {
    const schemaPath = writeTempFile("test.schema.json", schemaContent);
    const schema = loadSchema(schemaPath);
    expect(schema).toHaveProperty("API_KEY");
    expect(schema).toHaveProperty("PORT");
  });

  it("throws if schema file does not exist", () => {
    expect(() => loadSchema("/nonexistent/schema.json")).toThrow(
      "Schema file not found"
    );
  });
});

describe("auditEnv", () => {
  it("passes when all required keys are present and valid", () => {
    const envPath = writeTempFile("audit_pass.env", "API_KEY=abc\nPORT=3000\n");
    const schemaPath = writeTempFile("audit_pass.schema.json", schemaContent);
    const result = auditEnv({ envPath, schemaPath });
    expect(result.passed).toBe(true);
    expect(result.missingKeys).toHaveLength(0);
  });

  it("reports missing required keys", () => {
    const envPath = writeTempFile("audit_missing.env", "API_KEY=abc\n");
    const schemaPath = writeTempFile(
      "audit_missing.schema.json",
      schemaContent
    );
    const result = auditEnv({ envPath, schemaPath });
    expect(result.passed).toBe(false);
    expect(result.missingKeys).toContain("PORT");
  });

  it("reports extra keys in strict mode", () => {
    const envPath = writeTempFile(
      "audit_extra.env",
      "API_KEY=abc\nPORT=3000\nUNKNOWN=xyz\n"
    );
    const schemaPath = writeTempFile("audit_extra.schema.json", schemaContent);
    const result = auditEnv({ envPath, schemaPath, strict: true });
    expect(result.extraKeys).toContain("UNKNOWN");
    expect(result.passed).toBe(false);
  });

  it("does not report extra keys when strict mode is off", () => {
    const envPath = writeTempFile(
      "audit_nostrict.env",
      "API_KEY=abc\nPORT=3000\nUNKNOWN=xyz\n"
    );
    const schemaPath = writeTempFile(
      "audit_nostrict.schema.json",
      schemaContent
    );
    const result = auditEnv({ envPath, schemaPath, strict: false });
    expect(result.extraKeys).toHaveLength(0);
  });

  it("throws if env file does not exist", () => {
    const schemaPath = writeTempFile("audit_err.schema.json", schemaContent);
    expect(() =>
      auditEnv({ envPath: "/no/such/file.env", schemaPath })
    ).toThrow("Env file not found");
  });
});

describe("formatAuditResult", () => {
  it("includes PASSED status when audit passes", () => {
    const result = {
      file: ".env",
      missingKeys: [],
      extraKeys: [],
      invalidKeys: [],
      passed: true,
    };
    const output = formatAuditResult(result);
    expect(output).toContain("PASSED");
  });

  it("includes FAILED and lists missing keys", () => {
    const result = {
      file: ".env",
      missingKeys: ["API_KEY"],
      extraKeys: [],
      invalidKeys: [],
      passed: false,
    };
    const output = formatAuditResult(result);
    expect(output).toContain("FAILED");
    expect(output).toContain("API_KEY");
  });
});

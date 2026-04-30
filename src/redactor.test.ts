import { describe, it, expect } from "vitest";
import {
  isSensitiveKey,
  redactRecord,
  redactEnvContent,
} from "./redactor";

describe("isSensitiveKey", () => {
  it("detects password keys", () => {
    expect(isSensitiveKey("DB_PASSWORD")).toBe(true);
    expect(isSensitiveKey("password")).toBe(true);
  });

  it("detects token keys", () => {
    expect(isSensitiveKey("GITHUB_TOKEN")).toBe(true);
    expect(isSensitiveKey("ACCESS_TOKEN")).toBe(true);
  });

  it("detects api key variants", () => {
    expect(isSensitiveKey("API_KEY")).toBe(true);
    expect(isSensitiveKey("STRIPE_APIKEY")).toBe(true);
  });

  it("does not flag safe keys", () => {
    expect(isSensitiveKey("APP_NAME")).toBe(false);
    expect(isSensitiveKey("PORT")).toBe(false);
    expect(isSensitiveKey("NODE_ENV")).toBe(false);
  });

  it("respects extra sensitive keys list", () => {
    expect(isSensitiveKey("MY_CUSTOM_VAR", undefined, ["MY_CUSTOM_VAR"])).toBe(true);
  });
});

describe("redactRecord", () => {
  it("masks sensitive keys", () => {
    const record = {
      APP_NAME: "myapp",
      DB_PASSWORD: "supersecret",
      API_KEY: "abc123",
      PORT: "3000",
    };
    const result = redactRecord(record);
    expect(result.APP_NAME).toBe("myapp");
    expect(result.PORT).toBe("3000");
    expect(result.DB_PASSWORD).toBe("***REDACTED***");
    expect(result.API_KEY).toBe("***REDACTED***");
  });

  it("uses custom mask", () => {
    const record = { SECRET_KEY: "value" };
    const result = redactRecord(record, { mask: "[hidden]" });
    expect(result.SECRET_KEY).toBe("[hidden]");
  });

  it("handles empty record", () => {
    expect(redactRecord({})).toEqual({});
  });
});

describe("redactEnvContent", () => {
  it("masks sensitive values in env content", () => {
    const content = [
      "APP_NAME=myapp",
      "DB_PASSWORD=supersecret",
      "PORT=3000",
      "GITHUB_TOKEN=ghp_abc123",
    ].join("\n");
    const result = redactEnvContent(content);
    expect(result).toContain("APP_NAME=myapp");
    expect(result).toContain("PORT=3000");
    expect(result).toContain("DB_PASSWORD=***REDACTED***");
    expect(result).toContain("GITHUB_TOKEN=***REDACTED***");
  });

  it("preserves comments and blank lines", () => {
    const content = "# comment\n\nAPP_NAME=test";
    const result = redactEnvContent(content);
    expect(result).toContain("# comment");
    expect(result).toContain("APP_NAME=test");
  });

  it("handles lines without equals sign", () => {
    const content = "MALFORMED_LINE\nAPP=ok";
    const result = redactEnvContent(content);
    expect(result).toContain("MALFORMED_LINE");
    expect(result).toContain("APP=ok");
  });
});

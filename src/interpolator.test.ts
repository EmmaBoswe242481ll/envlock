import { describe, it, expect } from "vitest";
import {
  resolveValue,
  interpolateEnv,
  findUnresolvedRefs,
} from "./interpolator";

describe("resolveValue", () => {
  it("returns plain string unchanged", () => {
    expect(resolveValue("hello", {})).toBe("hello");
  });

  it("resolves a single reference", () => {
    expect(resolveValue("${HOST}", { HOST: "localhost" })).toBe("localhost");
  });

  it("resolves reference with surrounding text", () => {
    expect(
      resolveValue("http://${HOST}:${PORT}", { HOST: "localhost", PORT: "3000" })
    ).toBe("http://localhost:3000");
  });

  it("returns empty string for missing reference", () => {
    expect(resolveValue("${MISSING}", {})).toBe("");
  });

  it("stops recursion at depth 10", () => {
    const env = { A: "${A}" };
    // Should not throw, just return the raw value at max depth
    const result = resolveValue("${A}", env, 10);
    expect(result).toBe("${A}");
  });
});

describe("interpolateEnv", () => {
  it("resolves chained references", () => {
    const raw = {
      BASE_URL: "http://${HOST}",
      HOST: "example.com",
      API_URL: "${BASE_URL}/api",
    };
    const result = interpolateEnv(raw);
    expect(result.HOST).toBe("example.com");
    expect(result.BASE_URL).toBe("http://example.com");
    expect(result.API_URL).toBe("http://example.com/api");
  });

  it("leaves unresolvable refs as empty string", () => {
    const raw = { URL: "http://${UNKNOWN}" };
    const result = interpolateEnv(raw);
    expect(result.URL).toBe("http://");
  });

  it("handles env with no references", () => {
    const raw = { FOO: "bar", BAZ: "qux" };
    expect(interpolateEnv(raw)).toEqual({ FOO: "bar", BAZ: "qux" });
  });
});

describe("findUnresolvedRefs", () => {
  it("returns empty array when all refs resolved", () => {
    expect(findUnresolvedRefs({ FOO: "bar", URL: "http://localhost" })).toEqual(
      []
    );
  });

  it("detects unresolved references", () => {
    const result = findUnresolvedRefs({ URL: "http://${HOST}:${PORT}" });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ key: "URL", ref: "HOST" });
    expect(result[1]).toEqual({ key: "URL", ref: "PORT" });
  });
});

import { validateEnv, Schema } from "./schema";

describe("validateEnv", () => {
  const schema: Schema = {
    DATABASE_URL: {
      required: true,
      pattern: /^postgres:\/\//,
      description: "PostgreSQL connection string",
    },
    PORT: {
      required: true,
      pattern: /^\d+$/,
    },
    LOG_LEVEL: {
      required: false,
      description: "Logging verbosity",
    },
  };

  it("returns valid when all required vars are present and correct", () => {
    const env = {
      DATABASE_URL: "postgres://localhost/mydb",
      PORT: "3000",
    };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.invalid).toHaveLength(0);
  });

  it("reports missing required variables", () => {
    const env = { PORT: "3000" };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("DATABASE_URL");
  });

  it("reports invalid pattern for a present variable", () => {
    const env = {
      DATABASE_URL: "mysql://localhost/mydb",
      PORT: "3000",
    };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(false);
    expect(result.invalid).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "DATABASE_URL" }),
      ])
    );
  });

  it("emits a warning for missing optional variables", () => {
    const env = {
      DATABASE_URL: "postgres://localhost/mydb",
      PORT: "8080",
    };
    const result = validateEnv(env, schema);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("LOG_LEVEL"))).toBe(true);
  });

  it("treats empty string as missing for required vars", () => {
    const env = {
      DATABASE_URL: "",
      PORT: "3000",
    };
    const result = validateEnv(env, schema);
    expect(result.missing).toContain("DATABASE_URL");
  });
});

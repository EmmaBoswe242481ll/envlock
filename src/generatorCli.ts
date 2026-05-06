import { readFileSync } from "fs";
import { generateSchemaFile } from "./generator";

export interface GenerateArgs {
  input: string;
  output: string;
  format: "json" | "env";
}

export function parseGenerateArgs(argv: string[]): GenerateArgs {
  const args: GenerateArgs = {
    input: ".env",
    output: ".env.schema.json",
    format: "json",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--input" || arg === "-i") && argv[i + 1]) {
      args.input = argv[++i];
    } else if ((arg === "--output" || arg === "-o") && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === "--format" && argv[i + 1]) {
      const fmt = argv[++i];
      if (fmt === "json" || fmt === "env") args.format = fmt;
      else {
        console.error(`Unknown format: ${fmt}. Use 'json' or 'env'.`);
        process.exit(1);
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: generate-schema [--input .env] [--output .env.schema.json] [--format json|env]"
      );
      process.exit(0);
    }
  }
  return args;
}

export function runGenerator(argv: string[] = process.argv.slice(2)): void {
  const args = parseGenerateArgs(argv);

  let content: string;
  try {
    content = readFileSync(args.input, "utf-8");
  } catch {
    console.error(`Error: Cannot read input file '${args.input}'`);
    process.exit(1);
  }

  try {
    generateSchemaFile(content, args.output, args.format);
    console.log(`Schema written to '${args.output}' (format: ${args.format})`);
  } catch (err) {
    console.error(`Error writing schema: ${(err as Error).message}`);
    process.exit(1);
  }
}

runGenerator();

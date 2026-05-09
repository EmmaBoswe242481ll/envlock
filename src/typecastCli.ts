import { readFileSync, writeFileSync } from "fs";
import { typecastRecord, formatTypecastReport } from "./typecast";
import { parseEnvContent } from "./loader";

export interface TypecastArgs {
  input: string;
  output?: string;
  format: "text" | "json";
  apply: boolean;
}

export function parseTypecastArgs(argv: string[]): TypecastArgs {
  const args: TypecastArgs = {
    input: ".env",
    format: "text",
    apply: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--input" || arg === "-i") && argv[i + 1]) {
      args.input = argv[++i];
    } else if ((arg === "--output" || arg === "-o") && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === "--json") {
      args.format = "json";
    } else if (arg === "--apply") {
      args.apply = true;
    }
  }

  return args;
}

export function runTypecast(argv: string[] = process.argv.slice(2)): void {
  const args = parseTypecastArgs(argv);

  let raw: string;
  try {
    raw = readFileSync(args.input, "utf-8");
  } catch {
    console.error(`Error: Cannot read file "${args.input}"`);
    process.exit(1);
  }

  const record = parseEnvContent(raw);
  const result = typecastRecord(record);
  const report = formatTypecastReport(result);

  if (args.format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(report);
  }

  if (args.apply && args.output) {
    const lines = Object.entries(result)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join("\n");
    writeFileSync(args.output, lines + "\n", "utf-8");
    console.log(`\nApplied typecast written to "${args.output}"`);
  }
}

if (require.main === module) {
  runTypecast();
}

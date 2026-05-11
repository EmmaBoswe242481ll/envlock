import { readFileSync, writeFileSync } from "fs";
import { maskRecord, formatMaskResult } from "./masker";
import { parseEnvContent } from "./loader";

export interface MaskArgs {
  input: string;
  output?: string;
  format: "text" | "json";
  visibleChars: number;
  maskChar: string;
}

export function parseMaskArgs(argv: string[]): MaskArgs {
  const args: MaskArgs = {
    input: ".env",
    format: "text",
    visibleChars: 2,
    maskChar: "*",
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--input" || arg === "-i") && argv[i + 1]) {
      args.input = argv[++i];
    } else if ((arg === "--output" || arg === "-o") && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === "--format" && argv[i + 1]) {
      args.format = argv[++i] as "text" | "json";
    } else if (arg === "--visible" && argv[i + 1]) {
      args.visibleChars = parseInt(argv[++i], 10);
    } else if (arg === "--char" && argv[i + 1]) {
      args.maskChar = argv[++i];
    }
  }

  return args;
}

export function runMasker(argv: string[]): void {
  const args = parseMaskArgs(argv);

  let content: string;
  try {
    content = readFileSync(args.input, "utf-8");
  } catch {
    console.error(`Error: Could not read file "${args.input}"`);
    process.exit(1);
  }

  const record = parseEnvContent(content);
  const masked = maskRecord(record, {
    visibleChars: args.visibleChars,
    maskChar: args.maskChar,
  });

  const result = formatMaskResult(record, masked, args.format);

  if (args.output) {
    writeFileSync(args.output, result, "utf-8");
    console.log(`Masked output written to ${args.output}`);
  } else {
    console.log(result);
  }
}

if (require.main === module) {
  runMasker(process.argv.slice(2));
}

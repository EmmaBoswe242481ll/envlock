import { readFileSync } from "fs";
import { profileEnvFile, formatProfileResult } from "./profiler";

export interface ProfilerCliArgs {
  file: string;
  output: "text" | "json";
  minLength?: number;
  maxLength?: number;
}

export function parseProfilerArgs(argv: string[]): ProfilerCliArgs {
  const args: ProfilerCliArgs = { file: ".env", output: "text" };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--file" || arg === "-f") && argv[i + 1]) {
      args.file = argv[++i];
    } else if (arg === "--json") {
      args.output = "json";
    } else if (arg === "--min-length" && argv[i + 1]) {
      args.minLength = parseInt(argv[++i], 10);
    } else if (arg === "--max-length" && argv[i + 1]) {
      args.maxLength = parseInt(argv[++i], 10);
    } else if (!arg.startsWith("-")) {
      args.file = arg;
    }
  }

  return args;
}

export async function runProfiler(argv: string[]): Promise<void> {
  const args = parseProfilerArgs(argv);

  let content: string;
  try {
    content = readFileSync(args.file, "utf-8");
  } catch {
    console.error(`Error: Could not read file "${args.file}"`);
    process.exit(1);
  }

  const result = profileEnvFile(content, {
    minLength: args.minLength,
    maxLength: args.maxLength,
  });

  if (args.output === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatProfileResult(result));
  }

  if (result.warnings && result.warnings.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runProfiler(process.argv.slice(2));
}

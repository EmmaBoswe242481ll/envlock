import { promoteEnv, loadEnvRecord, writeEnvRecord, formatPromoteResult } from "./promoter";
import { parseEnvContent } from "./loader";
import { readFileSync, existsSync } from "fs";

export interface PromoteArgs {
  source: string;
  target: string;
  template: string;
  overwrite: boolean;
  dryRun: boolean;
}

export function parsePromoteArgs(argv: string[]): PromoteArgs {
  const args: PromoteArgs = {
    source: "",
    target: "",
    template: "",
    overwrite: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--source" && argv[i + 1]) args.source = argv[++i];
    else if (argv[i] === "--target" && argv[i + 1]) args.target = argv[++i];
    else if (argv[i] === "--template" && argv[i + 1]) args.template = argv[++i];
    else if (argv[i] === "--overwrite") args.overwrite = true;
    else if (argv[i] === "--dry-run") args.dryRun = true;
  }
  return args;
}

export function loadTemplateKeys(templatePath: string): string[] {
  if (!existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }
  const content = readFileSync(templatePath, "utf-8");
  const record = parseEnvContent(content);
  return Object.keys(record);
}

export async function runPromoter(argv: string[]): Promise<void> {
  const args = parsePromoteArgs(argv);

  if (!args.source || !args.target || !args.template) {
    console.error("Usage: promoter --source <file> --target <file> --template <file> [--overwrite] [--dry-run]");
    process.exit(1);
  }

  const sourceRecord = loadEnvRecord(args.source);
  const targetRecord = loadEnvRecord(args.target);
  const templateKeys = loadTemplateKeys(args.template);

  const { result, summary } = promoteEnv(sourceRecord, targetRecord, templateKeys, {
    overwrite: args.overwrite,
    dryRun: args.dryRun,
  });

  console.log(formatPromoteResult(summary, args.dryRun));

  if (!args.dryRun) {
    writeEnvRecord(args.target, result);
    console.log(`Written to ${args.target}`);
  }
}

if (process.argv[1]?.endsWith("promoterCli.ts") || process.argv[1]?.endsWith("promoterCli.js")) {
  runPromoter(process.argv.slice(2));
}

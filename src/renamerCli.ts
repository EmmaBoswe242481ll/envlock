import * as fs from "fs";
import * as path from "path";
import { parseEnvContent } from "./loader";
import { applyRenames, parseRenameRules, formatRenameResult } from "./renamer";

export interface RenamerCliArgs {
  inputFile: string;
  rulesFile?: string;
  rules?: string[];
  outputFile?: string;
  dryRun: boolean;
}

export function parseRenamerArgs(argv: string[]): RenamerCliArgs {
  const args: RenamerCliArgs = { inputFile: "", rules: [], dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--input" || argv[i] === "-i") {
      args.inputFile = argv[++i];
    } else if (argv[i] === "--rules-file" || argv[i] === "-r") {
      args.rulesFile = argv[++i];
    } else if (argv[i] === "--rule") {
      args.rules = args.rules ?? [];
      args.rules.push(argv[++i]);
    } else if (argv[i] === "--output" || argv[i] === "-o") {
      args.outputFile = argv[++i];
    } else if (argv[i] === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

export async function runRenamer(argv: string[]): Promise<void> {
  const args = parseRenamerArgs(argv);

  if (!args.inputFile) {
    console.error("Error: --input file is required");
    process.exit(1);
  }

  const content = fs.readFileSync(path.resolve(args.inputFile), "utf-8");
  const record = parseEnvContent(content);

  let ruleStrings: string[] = args.rules ?? [];
  if (args.rulesFile) {
    const rulesContent = fs.readFileSync(path.resolve(args.rulesFile), "utf-8");
    ruleStrings = ruleStrings.concat(
      rulesContent.split("\n").map((l) => l.trim()).filter(Boolean)
    );
  }

  if (ruleStrings.length === 0) {
    console.error("Error: at least one rename rule is required");
    process.exit(1);
  }

  const rules = parseRenameRules(ruleStrings);
  const result = applyRenames(record, rules);
  const report = formatRenameResult(result);

  console.log(report);

  if (!args.dryRun) {
    const output = Object.entries(result.renamed)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    const dest = args.outputFile ?? args.inputFile;
    fs.writeFileSync(path.resolve(dest), output + "\n", "utf-8");
    console.log(`Written to ${dest}`);
  }
}

if (require.main === module) {
  runRenamer(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

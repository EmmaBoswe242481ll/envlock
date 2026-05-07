import * as fs from "fs";
import * as path from "path";
import { detectDuplicates, formatDuplicateResult } from "./duplicator";

export interface DuplicateCliArgs {
  filePath: string;
  checkValues: boolean;
  json: boolean;
}

export function parseDuplicateArgs(argv: string[]): DuplicateCliArgs {
  const args = argv.slice(2);
  const filePath = args.find((a) => !a.startsWith("--")) ?? "";
  const checkValues = args.includes("--values");
  const json = args.includes("--json");

  if (!filePath) {
    console.error("Usage: duplicator <file> [--values] [--json]");
    process.exit(1);
  }

  return { filePath, checkValues, json };
}

export function runDuplicator(argv: string[] = process.argv): void {
  const { filePath, checkValues, json } = parseDuplicateArgs(argv);

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, "utf-8");
  const result = detectDuplicates(content, { checkValues });

  if (json) {
    console.log(
      JSON.stringify(
        {
          duplicateKeys: result.duplicateKeys,
          duplicateValues: result.duplicateValues,
          hasDuplicates: result.hasDuplicates,
        },
        null,
        2
      )
    );
  } else {
    console.log(formatDuplicateResult(result));
  }

  if (result.hasDuplicates) {
    process.exit(1);
  }
}

runDuplicator();

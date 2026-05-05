import * as fs from "fs";
import * as path from "path";
import { mergeEnvFiles, formatMergeResult, MergeStrategy } from "./merger";

export interface MergeCliArgs {
  files: string[];
  strategy: MergeStrategy;
  output?: string;
  showConflicts: boolean;
}

export function parseMergeArgs(argv: string[]): MergeCliArgs {
  const args = argv.slice(2);
  const files: string[] = [];
  let strategy: MergeStrategy = "last-wins";
  let output: string | undefined;
  let showConflicts = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--strategy" && args[i + 1]) {
      strategy = args[++i] as MergeStrategy;
    } else if (args[i] === "--output" && args[i + 1]) {
      output = args[++i];
    } else if (args[i] === "--show-conflicts") {
      showConflicts = true;
    } else if (!args[i].startsWith("--")) {
      files.push(args[i]);
    }
  }

  return { files, strategy, output, showConflicts };
}

export function runMerger(argv: string[] = process.argv): void {
  const { files, strategy, output, showConflicts } = parseMergeArgs(argv);

  if (files.length < 2) {
    console.error("Usage: envlock-merge <file1> <file2> [...files] [--strategy last-wins|first-wins|error-on-conflict] [--output <file>] [--show-conflicts]");
    process.exit(1);
  }

  try {
    const result = mergeEnvFiles(files, { strategy });
    const content = formatMergeResult(result);

    if (output) {
      fs.writeFileSync(output, content, "utf-8");
      console.log(`Merged ${files.length} files into ${path.basename(output)}`);
    } else {
      console.log(content);
    }

    if (showConflicts && result.conflicts.length > 0) {
      console.error(`\nConflicts detected (${result.conflicts.length}):`);
      for (const { key, values } of result.conflicts) {
        console.error(`  ${key}: ${values.join(" → ")}`);
      }
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

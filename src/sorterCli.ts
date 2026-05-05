#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { sortEnv } from "./sorter";

export interface SortArgs {
  input: string;
  output?: string;
  mode: "alpha" | "grouped";
  inPlace: boolean;
}

export function parseSortArgs(argv: string[]): SortArgs {
  const args = argv.slice(2);
  const result: SortArgs = {
    input: "",
    mode: "alpha",
    inPlace: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--mode" || arg === "-m") {
      const val = args[++i];
      if (val !== "alpha" && val !== "grouped") {
        throw new Error(`Invalid mode "${val}". Use "alpha" or "grouped".`);
      }
      result.mode = val;
    } else if (arg === "--output" || arg === "-o") {
      result.output = args[++i];
    } else if (arg === "--in-place" || arg === "-i") {
      result.inPlace = true;
    } else if (!arg.startsWith("-")) {
      result.input = arg;
    }
  }

  if (!result.input) {
    throw new Error("Input file is required.");
  }

  return result;
}

export function runSorter(argv: string[] = process.argv): void {
  let args: SortArgs;

  try {
    args = parseSortArgs(argv);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    console.error("Usage: envlock-sort <file> [--mode alpha|grouped] [--output <file>] [--in-place]");
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const sorted = sortEnv(content, args.mode);

  if (args.inPlace) {
    fs.writeFileSync(inputPath, sorted, "utf-8");
    console.log(`Sorted ${inputPath} in place (mode: ${args.mode}).`);
  } else if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.writeFileSync(outputPath, sorted, "utf-8");
    console.log(`Sorted output written to ${outputPath} (mode: ${args.mode}).`);
  } else {
    process.stdout.write(sorted);
  }
}

runSorter();

import { readFileSync, writeFileSync } from "fs";
import {
  parseWithComments,
  applyComments,
  stripComments,
  formatCommentResult,
} from "./commenter";

export interface CommentArgs {
  env: string;
  comments?: string;
  strip: boolean;
  output?: string;
}

export function parseCommentArgs(argv: string[]): CommentArgs {
  const args: CommentArgs = { env: ".env", strip: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--env") args.env = argv[++i];
    else if (argv[i] === "--comments") args.comments = argv[++i];
    else if (argv[i] === "--strip") args.strip = true;
    else if (argv[i] === "--output") args.output = argv[++i];
  }
  return args;
}

export function runCommenter(argv: string[]): void {
  const args = parseCommentArgs(argv);
  const envContent = readFileSync(args.env, "utf-8");
  let entries = parseWithComments(envContent);

  if (args.strip) {
    entries = stripComments(entries);
  } else if (args.comments) {
    const raw = readFileSync(args.comments, "utf-8");
    const commentMap: Record<string, string> = JSON.parse(raw);
    entries = applyComments(entries, commentMap);
  } else {
    console.error("Specify --strip or --comments <file>");
    process.exit(1);
  }

  const result = formatCommentResult(entries);
  if (args.output) {
    writeFileSync(args.output, result, "utf-8");
    console.log(`Written to ${args.output}`);
  } else {
    process.stdout.write(result);
  }
}

if (import.meta.main) {
  runCommenter(process.argv.slice(2));
}

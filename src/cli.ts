#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command, InvalidArgumentError } from "commander";
import { createPatch } from "diff";
import { beautifyMarkdown } from "./index.js";
import type { BeautifierConfig, BeautifierMode, EnhancementMode, TableMode, ToggleMode, WhiteboardMode } from "./config.js";

const program = new Command();

program
  .name("lark-beautifier")
  .description("Convert ordinary Markdown into Lark-friendly Markdown.")
  .argument("<input>", "input Markdown file")
  .option("-o, --output <file>", "output Markdown file")
  .option("--mode <mode>", "safe, structured, or bold", parseBeautifierMode)
  .option("--profile <profile>", "output profile", "lark")
  .option("--language <language>", "document language", "zh-CN")
  .option("--callouts <mode>", "off, auto, or conservative", parseToggleMode)
  .option("--grids <mode>", "off, auto, or conservative", parseToggleMode)
  .option("--tables <mode>", "markdown, smart, or lark", parseTableMode)
  .option("--whiteboards <mode>", "off, suggest, or insert-blank", parseWhiteboardMode)
  .option("--enhancements <mode>", "off, suggest, or draft", parseEnhancementMode)
  .option("--conservative", "prefer high-confidence conversions only")
  .option("--check", "check whether the file would change without writing")
  .option("--diff", "print a unified diff")
  .option("--to-lark-cli", "print a lark-cli docs +create command for the output path")
  .action(async (input: string, options) => {
    if (options.profile !== "lark") {
      throw new InvalidArgumentError("Only --profile lark is supported in this release.");
    }
    if (options.language !== "zh-CN") {
      throw new InvalidArgumentError("Only --language zh-CN is supported in this release.");
    }

    const inputPath = resolve(input);
    const source = await readFile(inputPath, "utf8");
    const output = beautifyMarkdown(source, collectConfigOptions(options));

    const changed = normalizeNewlines(source).trimEnd() !== output.trimEnd();

    if (options.diff) {
      process.stdout.write(createPatch(inputPath, source, output, "before", "after"));
    }

    if (options.check) {
      if (changed) {
        if (!options.diff) {
          process.stderr.write(`${inputPath} would be changed by lark-beautifier.\n`);
        }
        process.exitCode = 1;
      }
      return;
    }

    if (options.output) {
      const outputPath = resolve(options.output);
      await writeFile(outputPath, output, "utf8");
      if (options.toLarkCli) {
        process.stdout.write(`lark-cli docs +create --markdown "${escapeForDoubleQuotes(outputPath)}"\n`);
      }
      return;
    }

    process.stdout.write(output);
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`lark-beautifier: ${message}\n`);
  process.exitCode = 1;
});

function parseToggleMode(value: string): ToggleMode {
  if (value === "off" || value === "auto" || value === "conservative") {
    return value;
  }
  throw new InvalidArgumentError("Expected off, auto, or conservative.");
}

function parseBeautifierMode(value: string): BeautifierMode {
  if (value === "safe" || value === "structured" || value === "bold") {
    return value;
  }
  throw new InvalidArgumentError("Expected safe, structured, or bold.");
}

function parseTableMode(value: string): TableMode {
  if (value === "markdown" || value === "smart" || value === "lark") {
    return value;
  }
  throw new InvalidArgumentError("Expected markdown, smart, or lark.");
}

function parseWhiteboardMode(value: string): WhiteboardMode {
  if (value === "off" || value === "suggest" || value === "insert-blank") {
    return value;
  }
  throw new InvalidArgumentError("Expected off, suggest, or insert-blank.");
}

function parseEnhancementMode(value: string): EnhancementMode {
  if (value === "off" || value === "suggest" || value === "draft") {
    return value;
  }
  throw new InvalidArgumentError("Expected off, suggest, or draft.");
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function collectConfigOptions(options: Record<string, unknown>): Partial<BeautifierConfig> {
  return {
    profile: "lark",
    language: "zh-CN",
    ...(options.mode ? { mode: options.mode as BeautifierMode } : {}),
    ...(options.callouts ? { callouts: options.callouts as ToggleMode } : {}),
    ...(options.grids ? { grids: options.grids as ToggleMode } : {}),
    ...(options.tables ? { tables: options.tables as TableMode } : {}),
    ...(options.whiteboards ? { whiteboards: options.whiteboards as WhiteboardMode } : {}),
    ...(options.enhancements ? { enhancements: options.enhancements as EnhancementMode } : {}),
    ...(options.conservative ? { conservative: true } : {})
  };
}

function escapeForDoubleQuotes(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

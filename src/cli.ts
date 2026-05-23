#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command, InvalidArgumentError } from "commander";
import { createPatch } from "diff";
import { beautifyMarkdownWithReport } from "./index.js";
import type {
  BeautifierConfig,
  BeautifierMode,
  ComponentsOption,
  EnhancementMode,
  TableMode,
  ThemeOption,
  ToggleMode,
  VisualDensity,
  WhiteboardMode
} from "./config.js";
import type { ThemeName } from "./themes.js";

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
  .option("--theme <name>", "auto, technical-blue, warm-product, clean-minimal, or vivid-marketing", parseTheme)
  .option("--visual-density <density>", "minimal, balanced, or rich", parseVisualDensity)
  .option(
    "--components <value>",
    "off, auto, or comma-separated list of component names",
    parseComponents
  )
  .option("--analyze", "write SignalReport JSON to stderr")
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
    const { output, report } = beautifyMarkdownWithReport(source, collectConfigOptions(options));

    if (options.analyze) {
      process.stderr.write(`${JSON.stringify(report, null, 2)}\n`);
    }

    const changed = normalizeNewlines(source).trimEnd() !== output.trimEnd();

    if (options.diff) {
      process.stdout.write(createPatch(inputPath, source, output, "before", "after"));
    }

    if (options.check) {
      if (changed) {
        if (!options.diff) {
          process.stderr.write(`${inputPath} would be changed by lark-beautifier.\n`);
        }
        if (!options.analyze) {
          process.exitCode = 1;
        }
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

const THEME_NAMES: readonly ThemeName[] = [
  "technical-blue",
  "warm-product",
  "clean-minimal",
  "vivid-marketing"
];

function parseTheme(value: string): ThemeOption {
  if (value === "auto") return "auto";
  if ((THEME_NAMES as readonly string[]).includes(value)) return value as ThemeName;
  throw new InvalidArgumentError(
    "Expected auto, technical-blue, warm-product, clean-minimal, or vivid-marketing."
  );
}

function parseVisualDensity(value: string): VisualDensity {
  if (value === "minimal" || value === "balanced" || value === "rich") {
    return value;
  }
  throw new InvalidArgumentError("Expected minimal, balanced, or rich.");
}

const COMPONENT_NAMES = new Set([
  "cover-banner",
  "section-divider",
  "action-items",
  "kpi-card-row",
  "timeline",
  "before-after",
  "quote-block"
]);

function parseComponents(value: string): ComponentsOption {
  if (value === "off" || value === "auto") return value;
  const parts = value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) {
    throw new InvalidArgumentError("Expected off, auto, or a comma-separated component list.");
  }
  for (const part of parts) {
    if (!COMPONENT_NAMES.has(part)) {
      throw new InvalidArgumentError(
        `Unknown component "${part}". Expected one of ${[...COMPONENT_NAMES].join(", ")}.`
      );
    }
  }
  return parts;
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
    ...(options.theme ? { theme: options.theme as ThemeOption } : {}),
    ...(options.visualDensity ? { visualDensity: options.visualDensity as VisualDensity } : {}),
    ...(options.components !== undefined ? { components: options.components as ComponentsOption } : {}),
    ...(options.conservative ? { conservative: true } : {})
  };
}

function escapeForDoubleQuotes(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`lark-beautifier: ${message}\n`);
  process.exitCode = 1;
});

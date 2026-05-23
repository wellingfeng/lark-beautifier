import { parseMarkdown } from "./parser.js";
import { normalizeConfig, type BeautifierConfig } from "./config.js";
import { normalizeHeadings } from "./transforms/headings.js";
import { transformTypography } from "./transforms/typography.js";
import { transformCallouts } from "./transforms/callouts.js";
import { transformGrids } from "./transforms/grids.js";
import { transformTables } from "./transforms/tables.js";
import { transformWhiteboards } from "./transforms/whiteboards.js";
import { transformEnhancements } from "./transforms/enhancements.js";
import { analyzeContent, type SignalReport } from "./analyze/signals.js";
import { applyComponents } from "./transforms/components.js";
import { renderLarkMarkdown } from "./renderer/lark.js";
import type { BeautifierRoot } from "./types.js";

export { defaultConfig, normalizeConfig, type BeautifierConfig } from "./config.js";
export { analyzeContent, type SignalReport } from "./analyze/signals.js";

export function beautifyMarkdown(input: string, options: Partial<BeautifierConfig> = {}): string {
  const { output } = beautifyMarkdownWithReport(input, options);
  return output;
}

export function beautifyMarkdownWithReport(
  input: string,
  options: Partial<BeautifierConfig> = {}
): { output: string; report: SignalReport } {
  const config = normalizeConfig(options);
  const tree = parseMarkdown(input);

  normalizeHeadings(tree);
  transformTypography(tree, config);
  transformCallouts(tree, config);
  transformGrids(tree, config);
  transformTables(tree, config);

  const report = analyzeContent(tree);
  const rootWithMeta = tree as BeautifierRoot;
  rootWithMeta.larkBeautifier = { ...(rootWithMeta.larkBeautifier ?? {}), analysis: report };
  applyComponents(rootWithMeta, config);

  transformWhiteboards(tree, config);
  transformEnhancements(tree, config);

  return { output: renderLarkMarkdown(rootWithMeta), report };
}

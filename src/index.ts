import { parseMarkdown } from "./parser.js";
import { normalizeConfig, type BeautifierConfig } from "./config.js";
import { normalizeHeadings } from "./transforms/headings.js";
import { transformTypography } from "./transforms/typography.js";
import { transformCallouts } from "./transforms/callouts.js";
import { transformGrids } from "./transforms/grids.js";
import { transformTables } from "./transforms/tables.js";
import { transformWhiteboards } from "./transforms/whiteboards.js";
import { transformEnhancements } from "./transforms/enhancements.js";
import { renderLarkMarkdown } from "./renderer/lark.js";

export { defaultConfig, normalizeConfig, type BeautifierConfig } from "./config.js";

export function beautifyMarkdown(input: string, options: Partial<BeautifierConfig> = {}): string {
  const config = normalizeConfig(options);
  const tree = parseMarkdown(input);

  normalizeHeadings(tree);
  transformTypography(tree, config);
  transformCallouts(tree, config);
  transformGrids(tree, config);
  transformTables(tree, config);
  transformWhiteboards(tree, config);
  transformEnhancements(tree, config);

  return renderLarkMarkdown(tree);
}

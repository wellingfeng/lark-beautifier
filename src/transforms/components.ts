import type { Blockquote, Heading, Paragraph, Root, RootContent, ThematicBreak } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { themes, resolveThemeName, type ThemeName } from "../themes.js";
import type { BeautifierRoot, LarkCalloutNode, LarkGridNode, LarkTableNode } from "../types.js";
import type { SignalReport } from "../analyze/signals.js";
import { normalizeHeadingText, textContent } from "../analyzer.js";

export function applyComponents(tree: BeautifierRoot, config: BeautifierConfig): void {
  if (!config.components || config.components === "off") return;

  const report: SignalReport | undefined = tree.larkBeautifier?.analysis;
  if (!report) return;

  const allowed = resolveAllowedComponents(config.components, config.visualDensity);
  const theme = themes[resolveThemeName(config.theme, report.themeScores)];

  // Apply in reverse-index order where indices matter, OR by collecting indices
  // upfront and then mutating from the end. We use a simple approach: build a new
  // children array by walking the original, with the signal indices acting as
  // landmarks for replace/wrap operations.

  // Collect operations by original index.
  const wrapAtIndex = new Map<number, RootContent>(); // replace single node
  const prependAtIndex = new Map<number, RootContent[]>(); // insert before index
  const replaceRangeAtStart = new Map<number, { length: number; nodes: RootContent[] }>();

  if (allowed.coverBanner && report.components.coverBanner) {
    const { headingIndex, tldrIndex, text, title } = report.components.coverBanner;
    const node = buildCoverBanner(theme.name, title, text) as unknown as RootContent;
    // Replace the tldr paragraph with the callout.
    wrapAtIndex.set(tldrIndex, node);
    // Leave the H1 in place. headingIndex is informational.
    void headingIndex;
  }

  if (allowed.sectionDivider && report.components.sectionDividers.length > 0) {
    for (const divider of report.components.sectionDividers) {
      const inserts: RootContent[] = [];
      inserts.push({ type: "thematicBreak" } satisfies ThematicBreak);
      const emoji = config.visualDensity === "minimal" ? "" : divider.emoji;
      if (emoji) {
        const original = tree.children[divider.headingIndex] as Heading | undefined;
        if (original && original.type === "heading") {
          const decorated = decorateHeading(original, emoji);
          inserts.push(decorated);
          if (config.visualDensity === "rich" && divider.oneLineSummary) {
            inserts.push(makeSummaryParagraph(divider.oneLineSummary));
          }
          replaceRangeAtStart.set(divider.headingIndex, { length: 1, nodes: inserts });
          continue;
        }
      }
      prependAtIndex.set(divider.headingIndex, inserts);
      if (config.visualDensity === "rich" && divider.oneLineSummary) {
        const existing = prependAtIndex.get(divider.headingIndex) ?? [];
        existing.push(makeSummaryParagraph(divider.oneLineSummary));
        prependAtIndex.set(divider.headingIndex, existing);
      }
    }
  }

  if (allowed.kpiCardRow && report.components.kpiCardRow) {
    const { paragraphIndex, items } = report.components.kpiCardRow;
    wrapAtIndex.set(paragraphIndex, buildKpiCardRow(theme.name, items) as unknown as RootContent);
  }

  if (allowed.timeline && report.components.timeline) {
    const { listIndex, phases } = report.components.timeline;
    wrapAtIndex.set(listIndex, buildTimelineTable(phases) as unknown as RootContent);
  }

  if (allowed.beforeAfter && report.components.beforeAfter) {
    const range = buildBeforeAfterRange(tree.children, report.components.beforeAfter.startIndex, theme.name);
    if (range) {
      replaceRangeAtStart.set(report.components.beforeAfter.startIndex, range);
    }
  }

  if (allowed.quoteBlock && report.components.quoteBlocks.length > 0) {
    for (const signal of report.components.quoteBlocks) {
      const node = tree.children[signal.blockquoteIndex];
      if (node?.type !== "blockquote") continue;
      const next = tree.children[signal.blockquoteIndex + 1];
      const includesAttributionParagraph =
        next?.type === "paragraph" && normalizeHeadingText(textContent(next)).includes(signal.attribution);
      replaceRangeAtStart.set(signal.blockquoteIndex, {
        length: includesAttributionParagraph ? 2 : 1,
        nodes: [buildQuoteBlock(theme.name, node as Blockquote, signal.attribution) as unknown as RootContent]
      });
    }
  }

  if (allowed.actionItems && report.components.actionItems) {
    const { headingIndex, listIndex, items } = report.components.actionItems;
    const grid = buildActionItemsGrid(theme.name, items) as unknown as RootContent;
    const length = listIndex - headingIndex + 1;
    const keepHeading = tree.children[headingIndex];
    const nodes: RootContent[] = keepHeading ? [keepHeading, grid] : [grid];
    replaceRangeAtStart.set(headingIndex, { length, nodes });
  }

  // Compose new children array
  const next: RootContent[] = [];
  let i = 0;
  while (i < tree.children.length) {
    const replace = replaceRangeAtStart.get(i);
    if (replace) {
      next.push(...replace.nodes);
      i += replace.length;
      continue;
    }
    const prepend = prependAtIndex.get(i);
    if (prepend) {
      next.push(...prepend);
    }
    const wrap = wrapAtIndex.get(i);
    if (wrap) {
      next.push(wrap);
    } else {
      next.push(tree.children[i]);
    }
    i += 1;
  }

  tree.children = next;
}

interface AllowedComponents {
  coverBanner: boolean;
  sectionDivider: boolean;
  actionItems: boolean;
  kpiCardRow: boolean;
  timeline: boolean;
  beforeAfter: boolean;
  quoteBlock: boolean;
}

const COMPONENT_KEYS = new Map<string, keyof AllowedComponents>([
  ["cover-banner", "coverBanner"],
  ["section-divider", "sectionDivider"],
  ["action-items", "actionItems"],
  ["kpi-card-row", "kpiCardRow"],
  ["timeline", "timeline"],
  ["before-after", "beforeAfter"],
  ["quote-block", "quoteBlock"]
]);

function emptyAllowedComponents(): AllowedComponents {
  return {
    coverBanner: false,
    sectionDivider: false,
    actionItems: false,
    kpiCardRow: false,
    timeline: false,
    beforeAfter: false,
    quoteBlock: false
  };
}

function resolveAllowedComponents(
  value: BeautifierConfig["components"],
  density: BeautifierConfig["visualDensity"]
): AllowedComponents {
  if (value === "auto") {
    return {
      coverBanner: true,
      sectionDivider: density !== "minimal",
      actionItems: true,
      kpiCardRow: density !== "minimal",
      timeline: density !== "minimal",
      beforeAfter: density !== "minimal",
      quoteBlock: density === "rich"
    };
  }
  if (Array.isArray(value)) {
    const allowed = emptyAllowedComponents();
    for (const raw of value) {
      const key = COMPONENT_KEYS.get(raw.trim().toLowerCase());
      if (key) allowed[key] = true;
    }
    return allowed;
  }
  return emptyAllowedComponents();
}

function buildCoverBanner(themeName: ThemeName, title: string, body: string): LarkCalloutNode {
  const style = themes[themeName].callout.tldr;
  const paragraph: Paragraph = { type: "paragraph", children: [{ type: "text", value: body }] };
  return {
    type: "larkCallout",
    emoji: style.emoji,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    children: [
      titleHeading(title),
      paragraph
    ]
  };
}

function titleHeading(title: string): Paragraph {
  return {
    type: "paragraph",
    children: [{ type: "strong", children: [{ type: "text", value: title }] }]
  };
}

function makeSummaryParagraph(text: string): Paragraph {
  return {
    type: "paragraph",
    children: [{ type: "emphasis", children: [{ type: "text", value: text }] }]
  };
}

function decorateHeading(heading: Heading, emoji: string): Heading {
  const text = headingPlainText(heading);
  if (!text || text.startsWith(emoji)) return heading;
  const cloned = structuredClone(heading);
  cloned.children = [{ type: "text", value: `${emoji} ${text}` }];
  return cloned;
}

function headingPlainText(heading: Heading): string {
  return heading.children
    .map((child) => {
      if (child.type === "text") return child.value;
      if (child.type === "strong" || child.type === "emphasis") {
        return child.children.map((c) => (c.type === "text" ? c.value : "")).join("");
      }
      return "";
    })
    .join("");
}

function buildActionItemsGrid(themeName: ThemeName, items: string[]): LarkGridNode {
  const palette = themes[themeName].actionItemPalette;
  const cols = items.length >= 4 ? 2 : Math.min(items.length, 2);
  const columns: LarkGridNode["columns"] = [];
  for (let i = 0; i < items.length; i += 1) {
    const style = palette[i % palette.length];
    const callout: LarkCalloutNode = {
      type: "larkCallout",
      emoji: style.emoji,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      children: [
        {
          type: "paragraph",
          children: [{ type: "strong", children: [{ type: "text", value: items[i] }] }]
        }
      ]
    };
    columns.push({ title: "", children: [callout as unknown as Root["children"][number]] });
  }
  return { type: "larkGrid", cols, columns };
}

function buildKpiCardRow(themeName: ThemeName, items: Array<{ label: string; value: string }>): LarkGridNode {
  const palette = themes[themeName].actionItemPalette;
  return {
    type: "larkGrid",
    cols: Math.min(items.length, 4),
    columns: items.map((item, index) => {
      const style = palette[index % palette.length];
      const callout: LarkCalloutNode = {
        type: "larkCallout",
        emoji: style.emoji,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        children: [
          {
            type: "paragraph",
            children: [{ type: "strong", children: [{ type: "text", value: item.label }] }]
          },
          {
            type: "paragraph",
            children: [{ type: "strong", children: [{ type: "text", value: item.value }] }]
          }
        ]
      };
      return { title: "", children: [callout as unknown as Root["children"][number]] };
    })
  };
}

function buildTimelineTable(phases: Array<{ when: string; what: string }>): LarkTableNode {
  const cell = (value: string): Root["children"] => [{ type: "paragraph", children: [{ type: "text", value }] }];
  return {
    type: "larkTable",
    headers: [cell("阶段"), cell("时间"), cell("关键动作")],
    rows: phases.map((phase, index) => [cell(`阶段 ${index + 1}`), cell(phase.when), cell(phase.what)]),
    columnWidths: [120, 160, 420]
  };
}

function buildBeforeAfterRange(
  children: RootContent[],
  startIndex: number,
  themeName: ThemeName
): { length: number; nodes: RootContent[] } | undefined {
  const leftHeading = children[startIndex];
  if (leftHeading?.type !== "heading") return undefined;

  const rightIndex = findNextHeadingIndex(children, startIndex + 1, (leftHeading as Heading).depth);
  if (rightIndex === -1) return undefined;
  const rightHeading = children[rightIndex];
  if (rightHeading?.type !== "heading") return undefined;

  const left = collectSectionBody(children, startIndex, rightIndex);
  const rightEnd = findSectionEnd(children, rightIndex);
  const right = collectSectionBody(children, rightIndex, rightEnd);
  if (left.length === 0 || right.length === 0 || left.length > 4 || right.length > 4) {
    return undefined;
  }

  const grid = buildBeforeAfterGrid(
    themeName,
    headingPlainText(leftHeading as Heading),
    left,
    headingPlainText(rightHeading as Heading),
    right
  ) as unknown as RootContent;

  return { length: rightEnd - startIndex, nodes: [grid] };
}

function findNextHeadingIndex(children: RootContent[], from: number, depth: number): number {
  for (let i = from; i < children.length; i += 1) {
    const node = children[i];
    if (node.type === "heading" && (node as Heading).depth === depth) {
      return i;
    }
    if (node.type === "heading" && (node as Heading).depth < depth) {
      return -1;
    }
  }
  return -1;
}

function findSectionEnd(children: RootContent[], headingIndex: number): number {
  const heading = children[headingIndex] as Heading;
  for (let i = headingIndex + 1; i < children.length; i += 1) {
    const node = children[i];
    if (node.type === "heading" && (node as Heading).depth <= heading.depth) {
      return i;
    }
  }
  return children.length;
}

function collectSectionBody(children: RootContent[], headingIndex: number, endIndex: number): Root["children"] {
  return children.slice(headingIndex + 1, endIndex).filter((node) => node.type !== "thematicBreak") as Root["children"];
}

function buildBeforeAfterGrid(
  themeName: ThemeName,
  beforeTitle: string,
  beforeBody: Root["children"],
  afterTitle: string,
  afterBody: Root["children"]
): LarkGridNode {
  const beforeStyle = themes[themeName].callout.neutral;
  const afterStyle = themes[themeName].callout.success;
  return {
    type: "larkGrid",
    cols: 2,
    columns: [
      {
        title: "",
        children: [
          {
            type: "larkCallout",
            emoji: beforeStyle.emoji,
            backgroundColor: beforeStyle.backgroundColor,
            borderColor: beforeStyle.borderColor,
            children: [titleHeading(beforeTitle), ...beforeBody]
          } as unknown as Root["children"][number]
        ]
      },
      {
        title: "",
        children: [
          {
            type: "larkCallout",
            emoji: afterStyle.emoji,
            backgroundColor: afterStyle.backgroundColor,
            borderColor: afterStyle.borderColor,
            children: [titleHeading(afterTitle), ...afterBody]
          } as unknown as Root["children"][number]
        ]
      }
    ]
  };
}

function buildQuoteBlock(themeName: ThemeName, blockquote: Blockquote, attribution: string): LarkCalloutNode {
  const style = themes[themeName].callout.experimental;
  const attributionParagraph: Paragraph = {
    type: "paragraph",
    children: [{ type: "text", value: `-- ${attribution}` }]
  };
  return {
    type: "larkCallout",
    emoji: "💬",
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    children: [blockquote, attributionParagraph]
  };
}

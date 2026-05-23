import type { Blockquote, Heading, List, ListItem, Paragraph, Root, RootContent } from "mdast";
import { normalizeHeadingText, textContent } from "../analyzer.js";
import { themes, type ThemeName } from "../themes.js";
import { renderMarkdownBlocks } from "../renderer/markdown.js";

export type DocType = "release-notes" | "prd" | "exec-brief" | "marketing" | "weekly" | "unknown";

export interface CoverBannerSignal {
  headingIndex: number;
  tldrIndex: number;
  text: string;
  title: string;
}

export interface SectionDividerSignal {
  headingIndex: number;
  emoji: string;
  oneLineSummary: string;
}

export interface ActionItemsSignal {
  headingIndex: number;
  listIndex: number;
  items: string[];
}

export interface KpiCardRowSignal {
  paragraphIndex: number;
  items: Array<{ label: string; value: string }>;
}

export interface TimelineSignal {
  listIndex: number;
  phases: Array<{ when: string; what: string }>;
}

export interface BeforeAfterSignal {
  startIndex: number;
  beforeHeading: string;
  afterHeading: string;
}

export interface QuoteBlockSignal {
  blockquoteIndex: number;
  attribution: string;
}

export interface SignalReport {
  docType: DocType;
  docTypeConfidence: "low" | "med" | "high";
  recommendedTheme: ThemeName;
  themeScores: Record<ThemeName, number>;
  totalChars: number;
  headingCount: number;
  components: {
    coverBanner?: CoverBannerSignal;
    sectionDividers: SectionDividerSignal[];
    actionItems?: ActionItemsSignal;
    kpiCardRow?: KpiCardRowSignal;
    timeline?: TimelineSignal;
    beforeAfter?: BeforeAfterSignal;
    quoteBlocks: QuoteBlockSignal[];
  };
}

const TLDR_PATTERN = /^\s*(TL;?DR|摘要|概述|总结|要点|核心要点)[:：]?/i;
const ACTION_ITEMS_PATTERN = /^\s*(升级清单|行动项|待办事项|待办|检查清单|Checklist|TODO|Action\s+Items|Next\s+Steps)/i;
const KPI_LINE_PATTERN = /^\s*\*\*([^*]{1,16})\*\*[:：]\s*(.+)$/;
const TIMELINE_ITEM_PATTERN = /^\s*(\d{4}[-./年]\d{1,2}([-./月]\d{1,2})?日?|阶段\s?[一二三四五1-5]|Phase\s?\d|Q[1-4]\s?\d{4}?)[\s:：]+(.+)$/i;
const QUOTE_ATTRIBUTION_PATTERN = /^\s*[—–-]{1,3}\s*\S/;

export function scoreThemes(text: string): Record<ThemeName, number> {
  const lower = text.toLowerCase();
  const scores: Record<ThemeName, number> = {
    "technical-blue": 0,
    "warm-product": 0,
    "clean-minimal": 0,
    "vivid-marketing": 0
  };
  for (const themeName of Object.keys(scores) as ThemeName[]) {
    const bag = themes[themeName].keywordBag;
    let score = 0;
    for (const term of bag) {
      const needle = term.toLowerCase();
      let from = 0;
      while (true) {
        const idx = lower.indexOf(needle, from);
        if (idx === -1) break;
        score += 1;
        from = idx + needle.length;
        if (score > 20) break;
      }
    }
    scores[themeName] = score;
  }
  return scores;
}

export function detectDocType(report: Omit<SignalReport, "docType" | "docTypeConfidence">): {
  docType: DocType;
  confidence: SignalReport["docTypeConfidence"];
} {
  const t = report.themeScores;
  const top = Math.max(t["technical-blue"], t["warm-product"], t["clean-minimal"], t["vivid-marketing"]);
  if (top < 2) return { docType: "unknown", confidence: "low" };
  if (top === t["clean-minimal"]) return { docType: "exec-brief", confidence: top >= 5 ? "high" : "med" };
  if (top === t["vivid-marketing"]) return { docType: "marketing", confidence: top >= 5 ? "high" : "med" };
  if (top === t["warm-product"]) return { docType: "prd", confidence: top >= 5 ? "high" : "med" };
  if (report.components.actionItems && report.headingCount < 6) {
    return { docType: "weekly", confidence: "med" };
  }
  return { docType: "release-notes", confidence: top >= 5 ? "high" : "med" };
}

export function analyzeContent(tree: Root): SignalReport {
  const children = tree.children;
  const totalChars = textContent(tree).length;
  const themeScores = scoreThemes(textContent(tree));
  const headingCount = children.filter((c) => c.type === "heading" && (c as Heading).depth === 2).length;

  const coverBanner = detectCoverBanner(children);
  const sectionDividers = detectSectionDividers(children, headingCount, totalChars, themeScores);
  const actionItems = detectActionItems(children);
  const kpiCardRow = detectKpiCardRow(children);
  const timeline = detectTimeline(children);
  const beforeAfter = detectBeforeAfter(children);
  const quoteBlocks = detectQuoteBlocks(children);

  const partial = {
    recommendedTheme: pickTheme(themeScores),
    themeScores,
    totalChars,
    headingCount,
    components: {
      coverBanner,
      sectionDividers,
      actionItems,
      kpiCardRow,
      timeline,
      beforeAfter,
      quoteBlocks
    }
  };
  const { docType, confidence } = detectDocType(partial);

  return {
    docType,
    docTypeConfidence: confidence,
    ...partial
  };
}

function pickTheme(scores: Record<ThemeName, number>): ThemeName {
  let best: ThemeName = "technical-blue";
  let bestScore = 0;
  for (const name of Object.keys(scores) as ThemeName[]) {
    if (scores[name] > bestScore) {
      bestScore = scores[name];
      best = name;
    }
  }
  return bestScore >= 3 ? best : "technical-blue";
}

function detectCoverBanner(children: RootContent[]): CoverBannerSignal | undefined {
  const headingIndex = children.findIndex((c) => c.type === "heading" && (c as Heading).depth === 1);
  if (headingIndex === -1) return undefined;
  const heading = children[headingIndex] as Heading;
  const title = textContent(heading).trim();

  for (let i = headingIndex + 1; i < Math.min(children.length, headingIndex + 5); i += 1) {
    const node = children[i];
    if (node.type === "heading" && (node as Heading).depth === 1) break;
    if (node.type !== "paragraph" && node.type !== "heading") continue;
    const text = textContent(node).trim();
    if (TLDR_PATTERN.test(text)) {
      const cleaned = text.replace(TLDR_PATTERN, "").replace(/^[:：]/, "").trim();
      if (cleaned.length === 0 || cleaned.length > 600) continue;
      return { headingIndex, tldrIndex: i, text: cleaned, title };
    }
    if (node.type === "paragraph" && i === headingIndex + 1 && text.length <= 240 && text.length >= 20) {
      return { headingIndex, tldrIndex: i, text, title };
    }
  }
  return undefined;
}

function detectSectionDividers(
  children: RootContent[],
  headingCount: number,
  totalChars: number,
  themeScores: Record<ThemeName, number>
): SectionDividerSignal[] {
  if (headingCount < 5 || totalChars < 1500) return [];
  const theme = themes[pickTheme(themeScores)];
  const dividers: SectionDividerSignal[] = [];
  for (let i = 0; i < children.length; i += 1) {
    const node = children[i];
    if (node.type !== "heading" || (node as Heading).depth !== 2) continue;
    const headingText = normalizeHeadingText(textContent(node));
    let emoji = theme.defaultSectionEmoji;
    for (const { pattern, emoji: candidate } of theme.emojiByKeyword) {
      if (pattern.test(headingText)) {
        emoji = candidate;
        break;
      }
    }
    let summary = "";
    for (let j = i + 1; j < Math.min(children.length, i + 4); j += 1) {
      const next = children[j];
      if (next.type === "heading") break;
      if (next.type === "paragraph") {
        const text = textContent(next).trim();
        if (text.length === 0) continue;
        summary = text.split(/(?:\.(?=\s|$)|[。！？!?\n])/, 1)[0]?.trim() ?? "";
        if (summary.length > 60) summary = `${summary.slice(0, 58).trimEnd()}…`;
        break;
      }
    }
    dividers.push({ headingIndex: i, emoji, oneLineSummary: summary });
  }
  return dividers;
}

function detectActionItems(children: RootContent[]): ActionItemsSignal | undefined {
  for (let i = children.length - 1; i >= Math.max(0, children.length - 8); i -= 1) {
    const node = children[i];
    if (node.type !== "heading") continue;
    const depth = (node as Heading).depth;
    if (depth !== 2 && depth !== 3) continue;
    const text = normalizeHeadingText(textContent(node));
    if (!ACTION_ITEMS_PATTERN.test(text)) continue;
    for (let j = i + 1; j < Math.min(children.length, i + 4); j += 1) {
      const list = children[j];
      if (list.type !== "list") continue;
      const items = (list as List).children
        .map((item) => textContent(item).trim())
        .filter(Boolean);
      if (items.length < 2 || items.length > 6) return undefined;
      return { headingIndex: i, listIndex: j, items };
    }
  }
  return undefined;
}

function detectKpiCardRow(children: RootContent[]): KpiCardRowSignal | undefined {
  for (let i = 0; i < Math.min(children.length, 10); i += 1) {
    const node = children[i];
    if (node.type !== "paragraph") continue;
    const text = renderMarkdownBlocks([node as Paragraph]).trim();
    const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 3 || lines.length > 4) continue;
    const items: Array<{ label: string; value: string }> = [];
    for (const line of lines) {
      const match = line.match(KPI_LINE_PATTERN);
      if (!match) break;
      items.push({ label: match[1].trim(), value: match[2].trim() });
    }
    if (items.length === lines.length && items.length >= 3) {
      return { paragraphIndex: i, items };
    }
  }
  return undefined;
}

function detectTimeline(children: RootContent[]): TimelineSignal | undefined {
  for (let i = 0; i < children.length; i += 1) {
    const node = children[i];
    if (node.type !== "list") continue;
    const items = (node as List).children;
    if (items.length < 3 || items.length > 7) continue;
    const phases: Array<{ when: string; what: string }> = [];
    for (const item of items as ListItem[]) {
      const first = item.children[0];
      if (!first || first.type !== "paragraph") return undefined;
      const text = textContent(first).trim();
      const match = text.match(TIMELINE_ITEM_PATTERN);
      if (!match) break;
      phases.push({ when: match[1].trim(), what: match[3].trim() });
    }
    if (phases.length === items.length) {
      return { listIndex: i, phases };
    }
  }
  return undefined;
}

function detectBeforeAfter(children: RootContent[]): BeforeAfterSignal | undefined {
  for (let i = 0; i < children.length - 1; i += 1) {
    const left = children[i];
    if (!isHeading(left)) continue;
    const ld = (left as Heading).depth;
    if (ld < 2 || ld > 4) continue;
    const rightIndex = findNextHeadingAtDepth(children, i + 1, ld);
    if (rightIndex === -1) continue;
    const right = children[rightIndex];
    if (!isHeading(right)) continue;
    const rd = (right as Heading).depth;
    if (ld !== rd) continue;
    const lt = textContent(left);
    const rt = textContent(right);
    if (/(之前|旧|传统|Before)/i.test(lt) && /(现在|新|After|新增)/i.test(rt)) {
      return {
        startIndex: i,
        beforeHeading: normalizeHeadingText(lt),
        afterHeading: normalizeHeadingText(rt)
      };
    }
  }
  return undefined;
}

function detectQuoteBlocks(children: RootContent[]): QuoteBlockSignal[] {
  const results: QuoteBlockSignal[] = [];
  for (let i = 0; i < children.length; i += 1) {
    const node = children[i];
    if (node.type !== "blockquote") continue;
    const blockquote = node as Blockquote;
    const text = textContent(blockquote).trim();
    if (text.length < 8 || text.length > 360) continue;
    const next = children[i + 1];
    if (next?.type === "paragraph") {
      const nextText = textContent(next).trim();
      if (QUOTE_ATTRIBUTION_PATTERN.test(nextText)) {
        results.push({ blockquoteIndex: i, attribution: nextText.replace(/^[—–-]+\s*/, "").trim() });
        continue;
      }
    }
    if (QUOTE_ATTRIBUTION_PATTERN.test(text)) {
      const tail = text.split(/\n/).pop()?.trim() ?? "";
      results.push({ blockquoteIndex: i, attribution: tail.replace(/^[—–-]+\s*/, "").trim() });
    }
  }
  return results;
}

function isHeading(node: RootContent | undefined): node is Heading {
  return node?.type === "heading";
}

function findNextHeadingAtDepth(children: RootContent[], from: number, depth: number): number {
  for (let i = from; i < children.length; i += 1) {
    const node = children[i];
    if (!isHeading(node)) continue;
    if ((node as Heading).depth === depth) return i;
    if ((node as Heading).depth < depth) return -1;
  }
  return -1;
}

import type { Blockquote, Paragraph, Root, RootContent } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { textContent } from "../analyzer.js";
import type { LarkCalloutNode } from "../types.js";

interface CalloutStyle {
  emoji: string;
  backgroundColor: string;
  borderColor: string;
}

const calloutRules: Array<{ pattern: RegExp; anchoredPattern: RegExp; style: CalloutStyle }> = [
  { pattern: /(注意|提示|建议|说明)[:：]\s*/, anchoredPattern: /^(注意|提示|建议|说明)[:：]\s*/, style: { emoji: "💡", backgroundColor: "light-blue", borderColor: "blue" } },
  { pattern: /(结论|推荐|结果)[:：]\s*/, anchoredPattern: /^(结论|推荐|结果)[:：]\s*/, style: { emoji: "✅", backgroundColor: "light-green", borderColor: "green" } },
  { pattern: /(风险|警告|危险)[:：]\s*/, anchoredPattern: /^(风险|警告|危险)[:：]\s*/, style: { emoji: "⚠️", backgroundColor: "light-red", borderColor: "red" } },
  { pattern: /(重点|关键)[:：]\s*/, anchoredPattern: /^(重点|关键)[:：]\s*/, style: { emoji: "📌", backgroundColor: "light-yellow", borderColor: "yellow" } }
];

export function transformCallouts(tree: Root, config: BeautifierConfig): void {
  if (config.callouts === "off") {
    return;
  }

  const output: RootContent[] = [];

  for (const node of tree.children) {
    const paragraphBlocks = paragraphToCalloutBlocks(node, config);
    if (paragraphBlocks) {
      output.push(...(paragraphBlocks as unknown as RootContent[]));
      continue;
    }

    const callout = blockquoteToCallout(node, config);
    output.push((callout ?? node) as RootContent);
  }

  tree.children = output;
}

function paragraphToCalloutBlocks(node: RootContent, config: BeautifierConfig): Array<Paragraph | LarkCalloutNode> | undefined {
  if (node.type !== "paragraph") {
    return undefined;
  }

  const text = textContent(node).trim();
  const rule = calloutRules.find(({ pattern }) => pattern.test(text));
  if (!rule) {
    return undefined;
  }

  const match = text.match(rule.pattern);
  const matchIndex = match?.index ?? -1;
  if (matchIndex > 0 && !/[。！？；;.!?]\s*$/.test(text.slice(0, matchIndex))) {
    return undefined;
  }

  const paragraph = node as Paragraph;

  if (config.callouts === "conservative" && text.length > 180) {
    return undefined;
  }

  if (paragraph.children.length === 1 && paragraph.children[0]?.type === "text" && matchIndex > 0) {
    const original = paragraph.children[0].value;
    const markerMatch = original.match(rule.pattern);
    const markerIndex = markerMatch?.index ?? -1;
    if (markerIndex > 0) {
      const prefix = original.slice(0, markerIndex).trim();
      const calloutText = original.slice(markerIndex).replace(rule.anchoredPattern, "").trimStart();
      const blocks: Array<Paragraph | LarkCalloutNode> = [];
      if (prefix) {
        blocks.push({ type: "paragraph", children: [{ type: "text", value: prefix }] });
      }
      blocks.push(makeCallout(rule.style, [{ type: "paragraph", children: [{ type: "text", value: calloutText }] }]));
      return blocks;
    }
  }

  const cloned = structuredClone(paragraph);
  stripLeadingMarker(cloned, rule.anchoredPattern);
  return [makeCallout(rule.style, [cloned])];
}

function makeCallout(style: CalloutStyle, children: Root["children"]): LarkCalloutNode {
  return {
    type: "larkCallout",
    ...style,
    children
  };
}

function blockquoteToCallout(node: RootContent, config: BeautifierConfig): LarkCalloutNode | undefined {
  if (node.type !== "blockquote") {
    return undefined;
  }

  const blockquote = node as Blockquote;
  const text = textContent(blockquote).trim();
  const rule = calloutRules.find(({ pattern }) => pattern.test(text));
  if (!rule) {
    return undefined;
  }

  if (config.callouts === "conservative" && blockquote.children.length > 2) {
    return undefined;
  }

  const children = structuredClone(blockquote.children);
  const firstParagraph = children.find((child): child is Paragraph => child.type === "paragraph");
  if (firstParagraph) {
    stripLeadingMarker(firstParagraph, rule.anchoredPattern);
  }

  return {
    type: "larkCallout",
    ...rule.style,
    children
  };
}

function stripLeadingMarker(paragraph: Paragraph, pattern: RegExp): void {
  const firstText = paragraph.children.find((child) => child.type === "text");
  if (!firstText || firstText.type !== "text") {
    return;
  }

  firstText.value = firstText.value.replace(pattern, "").trimStart();
}

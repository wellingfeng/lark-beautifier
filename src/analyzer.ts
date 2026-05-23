import type { RootContent } from "mdast";

const whiteboardKeywords = [
  "架构图",
  "流程图",
  "时间线",
  "组织结构",
  "因果分析",
  "系统依赖",
  "依赖关系",
  "泳道图",
  "拓扑"
];

export function textContent(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  const typed = node as { value?: unknown; alt?: unknown; children?: unknown[] };
  if (typeof typed.value === "string") {
    return typed.value;
  }
  if (typeof typed.alt === "string") {
    return typed.alt;
  }
  if (Array.isArray(typed.children)) {
    return typed.children.map(textContent).join("");
  }

  return "";
}

export function isShortParagraph(node: RootContent, maxLength = 80): boolean {
  return node.type === "paragraph" && textContent(node).trim().length <= maxLength;
}

export function mentionsWhiteboardCandidate(text: string): boolean {
  return whiteboardKeywords.some((keyword) => text.includes(keyword));
}

export function normalizeHeadingText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

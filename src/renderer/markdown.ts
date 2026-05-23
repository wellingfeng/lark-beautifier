import type {
  Blockquote,
  Break,
  Code,
  Delete,
  Emphasis,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  Root,
  RootContent,
  Strong,
  Table,
  Text,
  ThematicBreak
} from "mdast";
import type { LarkBlock, LarkNode } from "../types.js";

export function renderMarkdownBlocks(children: Array<RootContent | LarkNode>): string {
  return children.map((child) => renderBlock(child as LarkBlock)).filter(Boolean).join("\n\n");
}

export function renderBlock(node: LarkBlock, listDepth = 0): string {
  switch (node.type) {
    case "paragraph":
      return renderParagraph(node);
    case "heading":
      return renderHeading(node);
    case "list":
      return renderList(node, listDepth);
    case "blockquote":
      return renderBlockquote(node);
    case "code":
      return renderCode(node);
    case "html":
      return renderHtml(node);
    case "thematicBreak":
      return renderThematicBreak(node);
    case "table":
      return renderTable(node);
    case "larkCallout":
    case "larkGrid":
    case "larkTable":
    case "larkWhiteboard":
    case "larkEnhancement":
      return "";
    default:
      return renderUnknownBlock(node as RootContent);
  }
}

export function renderInline(node: RootContent | Paragraph["children"][number]): string {
  switch (node.type) {
    case "text":
      return escapeMarkdownText((node as Text).value);
    case "strong":
      return `**${(node as Strong).children.map(renderInline).join("")}**`;
    case "emphasis":
      return `*${(node as Emphasis).children.map(renderInline).join("")}*`;
    case "inlineCode":
      return `\`${(node as InlineCode).value}\``;
    case "break":
      return renderBreak(node as Break);
    case "link":
      return renderLink(node as Link);
    case "image":
      return renderImage(node as Image);
    case "delete":
      return `~~${(node as Delete).children.map(renderInline).join("")}~~`;
    case "html":
      return (node as Html).value;
    default:
      return "children" in node && Array.isArray(node.children)
        ? (node.children as Paragraph["children"]).map(renderInline).join("")
        : "";
  }
}

function renderParagraph(node: Paragraph): string {
  return node.children.map(renderInline).join("").trimEnd();
}

function renderHeading(node: Heading): string {
  return `${"#".repeat(node.depth)} ${node.children.map(renderInline).join("").trim()}`;
}

function renderList(node: List, depth: number): string {
  const start = node.start ?? 1;
  return node.children
    .map((item, index) => renderListItem(item, node.ordered ? `${start + index}.` : "-", depth))
    .join("\n");
}

function renderListItem(node: ListItem, marker: string, depth: number): string {
  const indent = "  ".repeat(depth);
  const rendered = node.children.map((child) => renderBlock(child as LarkBlock, depth + 1)).filter(Boolean);
  if (rendered.length === 0) {
    return `${indent}${marker}`;
  }

  const [first, ...rest] = rendered;
  const firstLines = first.split("\n");
  const firstRendered = `${indent}${marker} ${firstLines[0]}${firstLines.length > 1 ? `\n${firstLines.slice(1).map((line) => `${indent}  ${line}`).join("\n")}` : ""}`;
  const restRendered = rest.map((block) => block.split("\n").map((line) => `${indent}  ${line}`).join("\n")).join("\n\n");
  return restRendered ? `${firstRendered}\n\n${restRendered}` : firstRendered;
}

function renderBlockquote(node: Blockquote): string {
  return node.children
    .map((child) => renderBlock(child as LarkBlock))
    .join("\n\n")
    .split("\n")
    .map((line) => `> ${line}`.trimEnd())
    .join("\n");
}

function renderCode(node: Code): string {
  const lang = node.lang ?? "";
  const meta = node.meta ? ` ${node.meta}` : "";
  return `\`\`\`${lang}${meta}\n${node.value}\n\`\`\``;
}

function renderHtml(node: Html): string {
  return node.value;
}

function renderThematicBreak(_node: ThematicBreak): string {
  return "---";
}

function renderTable(node: Table): string {
  if (node.children.length === 0) {
    return "";
  }

  const rows = node.children.map((row) => row.children.map((cell) => cell.children.map(renderInline).join("").trim()));
  const width = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => [...row, ...Array<string>(width - row.length).fill("")]);
  const header = normalizedRows[0];
  const body = normalizedRows.slice(1);
  const divider = header.map(() => "---");

  return [header, divider, ...body].map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function renderUnknownBlock(node: RootContent): string {
  if ("children" in node && Array.isArray(node.children)) {
    return (node.children as RootContent[]).map((child) => renderBlock(child as LarkBlock)).join("\n\n");
  }
  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }
  return "";
}

function renderBreak(_node: Break): string {
  return "  \n";
}

function renderLink(node: Link): string {
  const title = node.title ? ` "${node.title.replace(/"/g, '\\"')}"` : "";
  return `[${node.children.map(renderInline).join("")}](${node.url}${title})`;
}

function renderImage(node: Image): string {
  const title = node.title ? ` "${node.title.replace(/"/g, '\\"')}"` : "";
  return `![${node.alt ?? ""}](${node.url}${title})`;
}

function escapeMarkdownText(value: string): string {
  return value.replace(/\|/g, "\\|");
}

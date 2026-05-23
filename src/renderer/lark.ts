import type { Root, RootContent } from "mdast";
import type {
  BeautifierRoot,
  LarkBlock,
  LarkCalloutNode,
  LarkEnhancementNode,
  LarkGridNode,
  LarkNode,
  LarkTableNode,
  LarkWhiteboardNode
} from "../types.js";
import { renderBlock, renderMarkdownBlocks } from "./markdown.js";

export function renderLarkMarkdown(tree: BeautifierRoot): string {
  const body = renderLarkMarkdownBlocks(tree.children as Array<RootContent | LarkNode>);
  const frontmatter = tree.larkBeautifier?.frontmatter;
  const output = frontmatter ? `${frontmatter}\n\n${body}` : body;
  return `${output.trimEnd()}\n`;
}

export function renderLarkBlock(node: LarkBlock): string {
  switch (node.type) {
    case "larkCallout":
      return renderCallout(node);
    case "larkGrid":
      return renderGrid(node);
    case "larkTable":
      return renderLarkTable(node);
    case "larkWhiteboard":
      return renderWhiteboard(node);
    case "larkEnhancement":
      return renderEnhancement(node);
    default:
      return renderBlock(node);
  }
}

function renderCallout(node: LarkCalloutNode): string {
  const body = renderMarkdownBlocks(node.children as Root["children"]).trim();
  return [
    `<callout emoji="${node.emoji}" background-color="${node.backgroundColor}" border-color="${node.borderColor}">`,
    body,
    "</callout>"
  ].join("\n");
}

function renderGrid(node: LarkGridNode): string {
  const lines = [`<grid cols="${node.cols ?? node.columns.length}">`];
  for (const column of node.columns) {
    lines.push("<column>", "");
    if (column.title) {
      lines.push(`**${column.title}**`, "");
    }
    const body = renderLarkMarkdownBlocks(column.children as Array<RootContent | LarkNode>).trim();
    if (body) {
      lines.push(body, "");
    }
    lines.push("</column>");
  }
  lines.push("</grid>");
  return lines.join("\n");
}

function renderLarkTable(node: LarkTableNode): string {
  const widths = node.columnWidths?.length ? ` column-widths="${node.columnWidths.join(",")}"` : "";
  const lines = [`<lark-table${widths} header-row="true">`, "<lark-tr>"];
  for (const header of node.headers) {
    lines.push(renderTableCell(header, true));
  }
  lines.push("</lark-tr>");
  for (const row of node.rows) {
    lines.push("<lark-tr>");
    for (const cell of row) {
      lines.push(renderTableCell(cell));
    }
    lines.push("</lark-tr>");
  }
  lines.push("</lark-table>");
  return lines.join("\n");
}

function renderTableCell(children: Root["children"], header = false): string {
  const body = renderMarkdownBlocks(children).trim();
  const content = header && body ? `**${body.replace(/^\*\*|\*\*$/g, "")}**` : body;
  return [`<lark-td>`, content, "</lark-td>"].join("\n");
}

function renderWhiteboard(node: LarkWhiteboardNode): string {
  const title = node.title ? ` title="${escapeHtml(node.title)}"` : "";
  return `<whiteboard type="${node.boardType}"${title}></whiteboard>`;
}

function renderEnhancement(node: LarkEnhancementNode): string {
  const calloutLines = [
    '<callout emoji="🎨" background-color="light-purple" border-color="purple">',
    `**${node.title}**`,
    "",
    node.rationale,
    "",
    ...node.actions.map((action) => `- ${action}`)
  ];
  calloutLines.push("</callout>");

  if (node.artifact) {
    return [calloutLines.join("\n"), renderArtifact(node.artifact)].join("\n\n");
  }

  return calloutLines.join("\n");
}

function renderArtifact(artifact: NonNullable<LarkEnhancementNode["artifact"]>): string {
  if (artifact.type === "mermaid") {
    return ["```mermaid", artifact.value.trim(), "```"].join("\n");
  }
  if (artifact.type === "command") {
    return ["```bash", artifact.value.trim(), "```"].join("\n");
  }
  return ["```text", artifact.value.trim(), "```"].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderLarkMarkdownBlocks(children: Array<RootContent | LarkNode>): string {
  return children.map((child) => renderLarkBlock(child as LarkBlock)).filter(Boolean).join("\n\n");
}

import type { Root, RootContent, Table, TableCell, TableRow } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { textContent } from "../analyzer.js";
import type { LarkTableNode } from "../types.js";
import { renderMarkdownBlocks } from "../renderer/markdown.js";

const complexTableKeywords = ["决策", "风险", "排期", "计划", "负责人", "优先级", "矩阵"];

export function transformTables(tree: Root, config: BeautifierConfig): void {
  if (config.tables === "markdown") {
    return;
  }

  tree.children = tree.children.map((node, index, children) => {
    if (node.type !== "table") {
      return node;
    }

    const previousText = index > 0 ? textContent(children[index - 1]) : "";
    const larkTable = tableToLarkTable(node as Table, config, previousText);
    return (larkTable ?? node) as RootContent;
  });
}

function tableToLarkTable(table: Table, config: BeautifierConfig, context: string): LarkTableNode | undefined {
  const rows = table.children as TableRow[];
  if (rows.length === 0) {
    return undefined;
  }

  const headers = rows[0].children.map(renderCellBlocks);
  const bodyRows = rows.slice(1).map((row) => row.children.map(renderCellBlocks));
  const headerText = headers.map(renderBlocksText);
  const bodyTextRows = bodyRows.map((row) => row.map(renderBlocksText));

  if (config.tables === "smart" && !isComplexTable(headerText, bodyTextRows, context)) {
    return undefined;
  }

  return {
    type: "larkTable",
    headers,
    rows: bodyRows,
    columnWidths: headerText.map((header) => semanticColumnWidth(header))
  };
}

function isComplexTable(headers: string[], rows: string[][], context: string): boolean {
  const allText = [context, ...headers, ...rows.flat()].join(" ");
  const longCell = rows.flat().some((cell) => cell.length >= 42);
  const keywordHit = complexTableKeywords.some((keyword) => allText.includes(keyword));
  const wideTable = headers.length >= 5;

  return longCell || keywordHit || wideTable;
}

function renderCellText(cell: TableCell): string {
  return textContent(cell).trim().replace(/\s+/g, " ");
}

function renderCellBlocks(cell: TableCell): Root["children"] {
  return [
    {
      type: "paragraph",
      children: cell.children
    }
  ];
}

function renderBlocksText(blocks: Root["children"]): string {
  return renderMarkdownBlocks(blocks).trim().replace(/\s+/g, " ");
}

function semanticColumnWidth(header: string): number {
  const normalized = header.trim().toLowerCase();
  if (/^(id|#|序号|编号)$/.test(normalized)) return 80;
  if (/(负责人|owner|状态|status|优先级|priority|日期|时间|deadline|due|阶段)$/.test(normalized)) {
    return 120;
  }
  if (/(风险|影响|问题|issue|类型|type)$/.test(normalized)) return 160;
  if (/(描述|说明|缓解|计划|验收|标准|备注|详情|description|acceptance|mitigation|plan)/.test(normalized)) {
    return 360;
  }
  return Math.max(120, Math.min(280, header.length * 18 + 80));
}

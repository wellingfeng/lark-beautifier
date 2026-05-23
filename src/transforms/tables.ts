import type { Root, RootContent, Table, TableCell, TableRow } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { textContent } from "../analyzer.js";
import type { LarkTableNode } from "../types.js";

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

  const headers = rows[0].children.map(renderCellText);
  const bodyRows = rows.slice(1).map((row) => row.children.map(renderCellText));

  if (config.tables === "smart" && !isComplexTable(headers, bodyRows, context)) {
    return undefined;
  }

  return {
    type: "larkTable",
    headers,
    rows: bodyRows,
    columnWidths: headers.map((header) => Math.max(120, Math.min(280, header.length * 18 + 80)))
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

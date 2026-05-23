import type { Heading, List, Root, RootContent } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { normalizeHeadingText, textContent } from "../analyzer.js";
import type { LarkGridNode } from "../types.js";

const pairTitles = [
  ["优点", "缺点"],
  ["推荐", "不推荐"],
  ["现在", "未来"],
  ["方案 A", "方案 B"],
  ["方案A", "方案B"],
  ["Before", "After"]
];

export function transformGrids(tree: Root, config: BeautifierConfig): void {
  if (config.grids === "off") {
    return;
  }

  const output: RootContent[] = [];
  let index = 0;
  while (index < tree.children.length) {
    const grid = consecutiveHeadingSectionsToGrid(tree.children, index, config);
    if (grid) {
      output.push(grid as unknown as RootContent);
      index += grid.columns.length * 2;
      continue;
    }

    const listGrid = listToGrid(tree.children[index], config);
    if (listGrid) {
      output.push(listGrid as unknown as RootContent);
      index += 1;
      continue;
    }

    output.push(tree.children[index]);
    index += 1;
  }

  tree.children = output;
}

function consecutiveHeadingSectionsToGrid(
  children: RootContent[],
  start: number,
  config: BeautifierConfig
): LarkGridNode | undefined {
  const first = children[start];
  const second = children[start + 2];
  if (!isGridHeading(first) || !isGridHeading(second)) {
    return undefined;
  }

  if (!matchesTitlePair(textContent(first), textContent(second))) {
    return undefined;
  }

  const firstBody = children[start + 1];
  const secondBody = children[start + 3];
  if (!firstBody || !secondBody || firstBody.type === "heading" || secondBody.type === "heading") {
    return undefined;
  }

  if (config.grids === "conservative" && (textContent(firstBody).length > 240 || textContent(secondBody).length > 240)) {
    return undefined;
  }

  return {
    type: "larkGrid",
    columns: [
      { title: normalizeHeadingText(textContent(first)), children: [structuredClone(firstBody)] },
      { title: normalizeHeadingText(textContent(second)), children: [structuredClone(secondBody)] }
    ]
  };
}

function listToGrid(node: RootContent, config: BeautifierConfig): LarkGridNode | undefined {
  if (node.type !== "list" || node.ordered) {
    return undefined;
  }

  const list = node as List;
  if (list.children.length < 2 || list.children.length > 3) {
    return undefined;
  }

  const columns = list.children.map((item) => {
    const [firstChild, ...rest] = item.children;
    const firstText = firstChild ? textContent(firstChild).trim() : "";
    const titleMatch = firstText.match(/^(方案\s?[A-Z]|推荐|不推荐|优点|缺点|现在|未来)[:：]/i);
    if (!titleMatch) {
      return undefined;
    }

    const title = titleMatch[1];
    const clonedFirst = firstChild ? structuredClone(firstChild) : undefined;
    if (clonedFirst && clonedFirst.type === "paragraph") {
      const firstInline = clonedFirst.children.find((child) => child.type === "text");
      if (firstInline && firstInline.type === "text") {
        firstInline.value = firstInline.value.replace(/^(方案\s?[A-Z]|推荐|不推荐|优点|缺点|现在|未来)[:：]\s*/i, "");
      }
    }

    const children = [
      ...(clonedFirst && textContent(clonedFirst).trim() ? [clonedFirst] : []),
      ...structuredClone(rest)
    ];

    return { title: normalizeHeadingText(title), children };
  });

  if (columns.some((column) => !column)) {
    return undefined;
  }

  if (config.grids === "conservative" && textContent(node).length > 360) {
    return undefined;
  }

  return {
    type: "larkGrid",
    columns: columns as LarkGridNode["columns"]
  };
}

function isGridHeading(node: RootContent | undefined): node is Heading {
  return node?.type === "heading" && node.depth >= 3;
}

function matchesTitlePair(left: string, right: string): boolean {
  const normalizedLeft = normalizeHeadingText(left);
  const normalizedRight = normalizeHeadingText(right);
  return pairTitles.some(([a, b]) => normalizedLeft === a && normalizedRight === b);
}

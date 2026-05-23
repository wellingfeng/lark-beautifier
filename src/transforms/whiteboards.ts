import type { Heading, Root, RootContent } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { mentionsWhiteboardCandidate, textContent } from "../analyzer.js";
import type { LarkCalloutNode, LarkWhiteboardNode } from "../types.js";

export function transformWhiteboards(tree: Root, config: BeautifierConfig): void {
  if (config.whiteboards === "off") {
    return;
  }

  const output: RootContent[] = [];
  const insertedForHeadings = new Set<string>();
  const headingsWithMermaid = collectHeadingsWithMermaid(tree.children);

  for (const [index, node] of tree.children.entries()) {
    output.push(node);

    if (node.type !== "heading") {
      continue;
    }

    const text = textContent(node).trim();
    if (!mentionsWhiteboardCandidate(text) || insertedForHeadings.has(text) || headingsWithMermaid.has(index)) {
      continue;
    }

    insertedForHeadings.add(text);
    output.push(makeWhiteboardNode(config, text) as unknown as RootContent);
  }

  tree.children = output;
}

function collectHeadingsWithMermaid(children: RootContent[]): Set<number> {
  const headings = new Set<number>();
  const headingStack: Array<{ index: number; depth: number }> = [];

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index];
    if (node.type === "heading") {
      const depth = (node as Heading).depth;
      while (headingStack.length && headingStack[headingStack.length - 1].depth >= depth) {
        headingStack.pop();
      }
      headingStack.push({ index, depth });
      continue;
    }

    if (node.type === "code" && typeof node.lang === "string" && node.lang.toLowerCase() === "mermaid") {
      const current = headingStack[headingStack.length - 1];
      if (current) headings.add(current.index);
    }
  }

  return headings;
}

function makeWhiteboardNode(config: BeautifierConfig, title: string): LarkWhiteboardNode | LarkCalloutNode {
  if (config.whiteboards === "insert-blank") {
    return {
      type: "larkWhiteboard",
      boardType: "blank",
      title
    };
  }

  return {
    type: "larkCallout",
    emoji: "🧩",
    backgroundColor: "light-yellow",
    borderColor: "yellow",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: `建议为“${title}”补充飞书画板，后续可用 lark-whiteboard-cli 生成真实图示。`
          }
        ]
      }
    ]
  };
}

import type { Root, RootContent } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { mentionsWhiteboardCandidate, textContent } from "../analyzer.js";
import type { LarkCalloutNode, LarkWhiteboardNode } from "../types.js";

export function transformWhiteboards(tree: Root, config: BeautifierConfig): void {
  if (config.whiteboards === "off") {
    return;
  }

  const output: RootContent[] = [];
  const insertedForHeadings = new Set<string>();

  for (const node of tree.children) {
    output.push(node);

    if (node.type !== "heading") {
      continue;
    }

    const text = textContent(node).trim();
    if (!mentionsWhiteboardCandidate(text) || insertedForHeadings.has(text)) {
      continue;
    }

    insertedForHeadings.add(text);
    output.push(makeWhiteboardNode(config, text) as unknown as RootContent);
  }

  tree.children = output;
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

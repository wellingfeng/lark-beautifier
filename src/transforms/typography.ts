import type { Delete, Parent, Root, Text } from "mdast";
import { visit } from "unist-util-visit";
import type { BeautifierConfig } from "../config.js";

const fullWidthPunctuation: Record<string, string> = {
  ",": "，",
  "?": "？",
  "!": "！",
  ":": "：",
  ";": "；"
};

export function transformTypography(tree: Root, config: BeautifierConfig): void {
  if (config.language !== "zh-CN") {
    return;
  }

  visit(tree, "text", (node: Text, index: number | undefined, parent: Parent | undefined) => {
    if (index === undefined || !parent || shouldSkipTextParent(parent)) {
      return;
    }

    node.value = formatChineseText(node.value);
  });
}

export function formatChineseText(input: string): string {
  return input
    .replace(/[ \t]{2,}/g, " ")
    .replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2")
    .replace(/([\u4e00-\u9fff])([,?!:;])/g, (_, zh: string, punct: string) => {
      return `${zh}${fullWidthPunctuation[punct] ?? punct}`;
    })
    .replace(/([,?!:;])([\u4e00-\u9fff])/g, (_, punct: string, zh: string) => {
      return `${fullWidthPunctuation[punct] ?? punct}${zh}`;
    });
}

function shouldSkipTextParent(parent: Parent | Delete): boolean {
  return parent.type === "link" || parent.type === "linkReference" || parent.type === "definition";
}

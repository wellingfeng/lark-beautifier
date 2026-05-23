import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { BeautifierRoot } from "./types.js";

const frontmatterPattern = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

export function parseMarkdown(input: string): BeautifierRoot {
  const { frontmatter, body } = extractFrontmatter(input);
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as BeautifierRoot;
  tree.larkBeautifier = frontmatter ? { frontmatter } : {};
  return tree;
}

export function extractFrontmatter(input: string): { frontmatter?: string; body: string } {
  const match = input.match(frontmatterPattern);
  if (!match) {
    return { body: input };
  }

  return {
    frontmatter: match[0].replace(/\r\n/g, "\n").trimEnd(),
    body: input.slice(match[0].length)
  };
}

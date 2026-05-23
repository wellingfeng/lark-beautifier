import type { Heading, Root } from "mdast";

export function normalizeHeadings(tree: Root): void {
  let previousDepth = 0;

  for (const child of tree.children) {
    if (child.type !== "heading") {
      continue;
    }

    const heading = child as Heading;
    if (previousDepth > 0 && heading.depth > previousDepth + 1) {
      heading.depth = (previousDepth + 1) as Heading["depth"];
    }
    previousDepth = heading.depth;
  }
}

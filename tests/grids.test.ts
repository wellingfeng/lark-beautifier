import { describe, expect, it } from "vitest";
import { beautifyMarkdown } from "../src/index.js";

describe("grid transform", () => {
  it("converts paired option sections", () => {
    const input = [
      "## 对比",
      "",
      "### 方案 A",
      "",
      "- 快速",
      "",
      "### 方案 B",
      "",
      "- 稳妥"
    ].join("\n");

    const output = beautifyMarkdown(input);

    expect(output).toContain('<grid cols="2">');
    expect(output).toContain("**方案 A**");
    expect(output).toContain("**方案 B**");
  });
});

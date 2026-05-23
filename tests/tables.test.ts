import { describe, expect, it } from "vitest";
import { beautifyMarkdown } from "../src/index.js";

describe("table transform", () => {
  it("keeps simple tables as markdown", () => {
    const output = beautifyMarkdown("| A | B |\n|---|---|\n| 1 | 2 |\n");

    expect(output).toContain("| A | B |");
    expect(output).not.toContain("<lark-table");
  });

  it("converts risk tables to lark-table", () => {
    const output = beautifyMarkdown("## 风险矩阵\n\n| 风险 | 影响 |\n|---|---|\n| A | B |\n");

    expect(output).toContain("<lark-table");
    expect(output).toContain("<th>风险</th>");
  });
});

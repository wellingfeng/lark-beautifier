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
    expect(output).toContain("<lark-td>\n**风险**\n</lark-td>");
  });

  it("uses semantic widths and preserves inline markdown in cells", () => {
    const output = beautifyMarkdown([
      "## 行动项",
      "",
      "| 状态 | 负责人 | 缓解计划 |",
      "|---|---|---|",
      "| **进行中** | [平台组](https://example.com/team) | 运行 `npm test` 并记录结果 |"
    ].join("\n"));

    expect(output).toContain('column-widths="120,120,360"');
    expect(output).toContain("<lark-td>\n**进行中**\n</lark-td>");
    expect(output).toContain("<lark-td>\n[平台组](https://example.com/team)\n</lark-td>");
    expect(output).toContain("<lark-td>\n运行 `npm test` 并记录结果\n</lark-td>");
  });
});

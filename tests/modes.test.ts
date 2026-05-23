import { describe, expect, it } from "vitest";
import { beautifyMarkdown } from "../src/index.js";

const input = [
  "提示:请先确认权限。",
  "",
  "## 发布流程",
  "",
  "- 提交审批",
  "- 发布公告",
  "",
  "## 风险矩阵",
  "",
  "| 风险 | 影响 | 负责人 |",
  "|---|---|---|",
  "| 数据泄露 | 高 | 安全 |"
].join("\n");

describe("mode presets", () => {
  it("safe mode keeps output conservative", () => {
    const output = beautifyMarkdown(input, { mode: "safe" });

    expect(output).toContain("<callout");
    expect(output).not.toContain("<lark-table");
    expect(output).not.toContain("视觉增强建议");
  });

  it("structured mode adds visual suggestions without artifacts", () => {
    const output = beautifyMarkdown(input, { mode: "structured" });

    expect(output).toContain("<lark-table");
    expect(output).toContain("视觉增强建议：流程图");
    expect(output).not.toContain("```mermaid");
  });

  it("bold mode adds draft visual artifacts", () => {
    const output = beautifyMarkdown(input, { mode: "bold" });

    expect(output).toContain("<lark-table");
    expect(output).toContain("```mermaid");
  });
});

import { describe, expect, it } from "vitest";
import { beautifyMarkdown } from "../src/index.js";

describe("enhancement suggestions", () => {
  it("keeps enhancement suggestions off by default", () => {
    const output = beautifyMarkdown("## 发布流程\n\n- 提交审批\n- 发布公告\n");

    expect(output).not.toContain("视觉增强建议");
  });

  it("suggests visual treatments without inserting artifacts", () => {
    const output = beautifyMarkdown("## 发布流程\n\n- 提交审批\n- 发布公告\n", {
      enhancements: "suggest"
    });

    expect(output).toContain("视觉增强建议：流程图");
    expect(output).toContain("先让用户确认是否允许把正文步骤重构为图示。");
    expect(output).not.toContain("```mermaid");
  });

  it("can include draft Mermaid artifacts for review", () => {
    const output = beautifyMarkdown("## 指标趋势\n\n转化率从 10% 到 15%。\n", {
      enhancements: "draft"
    });

    expect(output).toContain("视觉增强建议：图表");
    expect(output).toContain("```mermaid");
    expect(output).toContain("xychart-beta");
  });

  it("suggests image card workflows for Xiaohongshu content", () => {
    const output = beautifyMarkdown("## 小红书发布\n\n这是一篇活动复盘。\n", {
      enhancements: "draft"
    });

    expect(output).toContain("视觉增强建议：封面/配图");
    expect(output).toContain("baoyu-xhs-images prompt");
  });
});

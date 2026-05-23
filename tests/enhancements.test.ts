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

  it("does not add enhancement suggestions to the document title", () => {
    const output = beautifyMarkdown("# 技术架构说明\n\n摘要：这里先介绍系统边界。\n", {
      enhancements: "suggest"
    });

    expect(output).not.toContain("视觉增强建议");
  });

  it("does not suggest charts without numeric evidence", () => {
    const output = beautifyMarkdown("## 成本与收益\n\n这里讨论维护成本、材质切换和收益边界，但没有给出数字。\n", {
      enhancements: "suggest"
    });

    expect(output).not.toContain("视觉增强建议：图表");
  });

  it("does not emit generic placeholder Mermaid artifacts in draft mode", () => {
    const output = beautifyMarkdown("## 指标趋势\n\n转化率从 10% 到 15%。\n", {
      enhancements: "draft"
    });

    expect(output).toContain("视觉增强建议：图表");
    expect(output).not.toContain("```mermaid");
    expect(output).not.toContain("xychart-beta");
  });

  it("keeps source-derived analysis artifacts outside enhancement callouts", () => {
    const output = beautifyMarkdown([
      "# 发布节奏",
      "",
      "- Phase 1：完成内部灰度",
      "- Phase 2：扩大到核心项目",
      "- Phase 3：发布稳定版"
    ].join("\n"), {
      enhancements: "draft"
    });

    const calloutEnd = output.indexOf("</callout>");
    const artifactStart = output.indexOf("```mermaid");
    expect(calloutEnd).toBeGreaterThan(-1);
    expect(artifactStart).toBeGreaterThan(calloutEnd);
  });

  it("does not suggest a placeholder diagram when the section already contains Mermaid", () => {
    const output = beautifyMarkdown([
      "## 发布流程图",
      "",
      "下面是实际发布路径。",
      "",
      "```mermaid",
      "flowchart LR",
      "  A[Build] --> B[Deploy]",
      "```"
    ].join("\n"), {
      enhancements: "draft",
      whiteboards: "suggest"
    });

    expect(output).not.toContain("视觉增强建议：流程图");
    expect(output).not.toContain("补充飞书画板");
    expect(output).toContain("flowchart LR");
  });

  it("suggests image card workflows for Xiaohongshu content", () => {
    const output = beautifyMarkdown("## 小红书发布\n\n这是一篇活动复盘。\n", {
      enhancements: "draft"
    });

    expect(output).toContain("视觉增强建议：封面/配图");
    expect(output).toContain("baoyu-xhs-images prompt");
  });

  it("uses analyzer signals to suggest timeline treatment beyond heading keywords", () => {
    const output = beautifyMarkdown([
      "# 发布节奏",
      "",
      "- Phase 1：完成内部灰度",
      "- Phase 2：扩大到核心项目",
      "- Phase 3：发布稳定版"
    ].join("\n"), {
      enhancements: "suggest"
    });

    expect(output).toContain("视觉增强建议：时间线");
    expect(output).toContain("检测到 3 个按时间或阶段排列的事项");
  });
});

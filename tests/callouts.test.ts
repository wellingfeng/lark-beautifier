import { describe, expect, it } from "vitest";
import { beautifyMarkdown } from "../src/index.js";

describe("callout transform", () => {
  it("converts high-confidence cue paragraphs", () => {
    const output = beautifyMarkdown("提示:请先确认权限。");

    expect(output).toContain('<callout emoji="💡" background-color="light-blue" border-color="blue">');
    expect(output).toContain("请先确认权限。");
  });

  it("converts blockquotes with risk markers", () => {
    const output = beautifyMarkdown("> 风险：发布前没有回滚方案。");

    expect(output).toContain('<callout emoji="⚠️" background-color="light-red" border-color="red">');
    expect(output).toContain("发布前没有回滚方案。");
  });
});

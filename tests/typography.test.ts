import { describe, expect, it } from "vitest";
import { beautifyMarkdown } from "../src/index.js";

describe("typography transform", () => {
  it("adds safe spaces between Chinese and Latin text", () => {
    const output = beautifyMarkdown("使用lark-cli创建docs。");

    expect(output).toContain("使用 lark-cli 创建 docs。");
  });

  it("does not modify inline code or link URLs", () => {
    const output = beautifyMarkdown("访问[测试](https://example.com/a?name=中文Test)，运行`const x=\"中文Test\"`。");

    expect(output).toContain("(https://example.com/a?name=中文Test)");
    expect(output).toContain("`const x=\"中文Test\"`");
  });
});

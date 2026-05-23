import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { beautifyMarkdown } from "../src/index.js";

async function loadFixture(name: string): Promise<string> {
  return readFile(resolve(__dirname, "fixtures", name), "utf8");
}

describe("component injection", () => {
  it("does nothing when components are off (default)", async () => {
    const source = await loadFixture("release-notes-with-tldr.md");
    const output = beautifyMarkdown(source, { mode: "structured" });

    expect(output).not.toContain('emoji="🚀"');
    expect(output).not.toContain('emoji="✅"');
    expect(output).not.toContain('emoji="🎯"');
    expect(output).not.toContain("<grid ");
  });

  it("injects cover banner when components=auto and TL;DR is detected", async () => {
    const source = await loadFixture("release-notes-with-tldr.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: "auto",
      theme: "technical-blue"
    });

    expect(output).toContain('background-color="light-blue"');
    expect(output).toContain("Mesh Shader");
  });

  it("injects action-items grid when components=auto and a checklist is detected", async () => {
    const source = await loadFixture("release-notes-with-tldr.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: "auto",
      theme: "technical-blue"
    });

    expect(output).toMatch(/<grid cols="\d+">/);
    expect(output).toContain("拉取 5.8 release 分支");
  });

  it("emits section dividers (thematic break + decorated heading) when doc is long", async () => {
    const source = await loadFixture("release-notes-with-tldr.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: "auto",
      theme: "technical-blue"
    });

    expect(output).toContain("\n---\n");
  });

  it("uses colored guide blocks for rich section dividers", async () => {
    const source = await loadFixture("release-notes-with-tldr.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: "auto",
      theme: "technical-blue",
      visualDensity: "rich"
    });

    expect(output).toContain("**本节导读**");
    expect(output).toContain('<callout emoji="📌" background-color="light-blue" border-color="blue">');
    expect(output).toContain("新版本默认开启 Mesh Shader");
  });

  it("does not emit dividers on short documents", async () => {
    const source = await loadFixture("short-doc-no-dividers.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: "auto",
      theme: "clean-minimal"
    });

    expect(output).not.toContain("\n---\n");
  });

  it("supports partial opt-in via comma-separated list", async () => {
    const source = await loadFixture("release-notes-with-tldr.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: ["cover-banner"],
      theme: "technical-blue"
    });

    expect(output).toContain('background-color="light-blue"');
    expect(output).not.toMatch(/<grid cols="\d+">[\s\S]*拉取 5\.8 release 分支/);
  });

  it("injects components in clean-minimal theme palette for exec briefs", async () => {
    const source = await loadFixture("exec-brief-with-checklist.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: "auto",
      theme: "auto"
    });

    expect(output).toContain("启动审计系统二期需求评审");
    expect(output).toMatch(/<grid cols="\d+">/);
  });

  it("injects KPI, timeline, before-after, and quote components when requested", async () => {
    const source = await loadFixture("rich-components.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: ["kpi-card-row", "timeline", "before-after", "quote-block"],
      theme: "technical-blue"
    });

    expect(output).toContain("**版本**");
    expect(output).toContain("**5.8**");
    expect(output).toContain('<lark-table column-widths="120,160,420" header-row="true">');
    expect(output).toContain("<lark-td>\n**阶段**\n</lark-td>");
    expect(output).toContain("Phase 1");
    expect(output).toContain("**旧流程**");
    expect(output).toContain("**新流程**");
    expect(output).toContain('emoji="💬"');
    expect(output).toContain("-- 技术美术负责人");
  });

  it("keeps rich-only quote blocks out of components=auto at balanced density", async () => {
    const source = await loadFixture("rich-components.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: "auto",
      theme: "technical-blue"
    });

    expect(output).not.toContain('emoji="💬"');
    expect(output).toContain("> 升级说明如果能先看到重点和行动项，团队会更容易配合。");
  });

  it("uses minimal visual density to avoid dividers and secondary component types", async () => {
    const source = await loadFixture("rich-components.md");
    const output = beautifyMarkdown(source, {
      mode: "structured",
      components: "auto",
      theme: "technical-blue",
      visualDensity: "minimal"
    });

    expect(output).toContain("本次发布面向产品与工程团队");
    expect(output).not.toContain('<lark-table column-widths="120,160,420" header-row="true">');
    expect(output).not.toContain("\n---\n");
  });
});

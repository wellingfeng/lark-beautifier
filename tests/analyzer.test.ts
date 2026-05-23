import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeContent } from "../src/analyze/signals.js";
import { parseMarkdown } from "../src/parser.js";

async function loadFixture(name: string): Promise<string> {
  return readFile(resolve(__dirname, "fixtures", name), "utf8");
}

describe("content analyzer", () => {
  it("detects cover banner from TL;DR paragraph", async () => {
    const tree = parseMarkdown(await loadFixture("release-notes-with-tldr.md"));
    const report = analyzeContent(tree);

    expect(report.components.coverBanner).toBeDefined();
    expect(report.components.coverBanner?.headingIndex).toBe(0);
    expect(report.components.coverBanner?.title).toContain("UE 5.8");
    expect(report.components.coverBanner?.text).toContain("Mesh Shader");
  });

  it("detects section dividers when doc is long enough and has many H2", async () => {
    const tree = parseMarkdown(await loadFixture("release-notes-with-tldr.md"));
    const report = analyzeContent(tree);

    expect(report.components.sectionDividers.length).toBeGreaterThanOrEqual(5);
    for (const divider of report.components.sectionDividers) {
      expect(divider.emoji).toBeTruthy();
    }
  });

  it("does not emit section dividers for short docs", async () => {
    const tree = parseMarkdown(await loadFixture("short-doc-no-dividers.md"));
    const report = analyzeContent(tree);

    expect(report.components.sectionDividers).toEqual([]);
  });

  it("detects action items list under matching heading", async () => {
    const tree = parseMarkdown(await loadFixture("release-notes-with-tldr.md"));
    const report = analyzeContent(tree);

    expect(report.components.actionItems).toBeDefined();
    expect(report.components.actionItems?.items.length).toBeGreaterThanOrEqual(2);
    expect(report.components.actionItems?.items.length).toBeLessThanOrEqual(6);
  });

  it("detects Next Steps as action items", async () => {
    const tree = parseMarkdown(await loadFixture("exec-brief-with-checklist.md"));
    const report = analyzeContent(tree);

    expect(report.components.actionItems).toBeDefined();
    expect(report.components.actionItems?.items).toHaveLength(3);
  });

  it("scores themes and picks clean-minimal for executive briefs", async () => {
    const tree = parseMarkdown(await loadFixture("exec-brief-with-checklist.md"));
    const report = analyzeContent(tree);

    expect(report.recommendedTheme).toBe("clean-minimal");
    expect(report.docType).toBe("exec-brief");
  });

  it("scores themes and picks technical-blue for engine release notes", async () => {
    const tree = parseMarkdown(await loadFixture("release-notes-with-tldr.md"));
    const report = analyzeContent(tree);

    expect(report.recommendedTheme).toBe("technical-blue");
  });

  it("returns deterministic report shape", async () => {
    const tree = parseMarkdown(await loadFixture("short-doc-no-dividers.md"));
    const report = analyzeContent(tree);

    expect(report).toMatchObject({
      docType: expect.any(String),
      docTypeConfidence: expect.any(String),
      recommendedTheme: expect.any(String),
      themeScores: expect.any(Object),
      totalChars: expect.any(Number),
      headingCount: expect.any(Number),
      components: expect.any(Object)
    });
    expect(report.components.sectionDividers).toEqual([]);
    expect(report.components.quoteBlocks).toEqual([]);
  });
});

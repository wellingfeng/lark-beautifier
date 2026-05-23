import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("CLI", () => {
  it("accepts theme and component options", async () => {
    const dir = await mkdtemp(join(tmpdir(), "lark-beautifier-cli-"));
    const input = join(dir, "input.md");
    const output = join(dir, "output.md");

    await writeFile(input, [
      "# 发布计划",
      "",
      "摘要：这次发布需要明确节奏。",
      "",
      "- Phase 1：灰度",
      "- Phase 2：扩大范围",
      "- Phase 3：正式发布"
    ].join("\n"), "utf8");

    const result = spawnSync(process.execPath, [
      resolve(process.cwd(), "dist", "cli.js"),
      input,
      "--output",
      output,
      "--mode",
      "structured",
      "--theme",
      "technical-blue",
      "--components",
      "auto",
      "--visual-density",
      "rich",
      "--enhancements",
      "off"
    ], {
      cwd: process.cwd(),
      encoding: "utf8"
    });

    expect(result.status, result.stderr).toBe(0);
    const actual = await readFile(output, "utf8");
    expect(actual).toContain("<lark-table");
    expect(actual).toContain("Phase 1");
  });
});

import { execFile } from "node:child_process";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("write-back dry-run plan", () => {
  it("summarizes structural changes without applying them", async () => {
    const planPath = join(process.cwd(), "tmp", "test-writeback-plan.json");
    await rm(planPath, { force: true });

    const { stdout } = await execFileAsync(process.execPath, [
      "skills/lark-beautifier/scripts/lark-doc-writeback.mjs",
      "--doc",
      "https://example.feishu.cn/docx/ABCDEFGHIJKLMNOPQRSTUV",
      "--input",
      "tests/fixtures/writeback-source.md",
      "--mode",
      "structured",
      "--plan-output",
      planPath
    ], { cwd: process.cwd() });

    const printed = JSON.parse(stdout);
    const saved = JSON.parse(await readFile(planPath, "utf8"));

    expect(printed.dryRun).toBe(true);
    expect(saved.source.kind).toBe("file");
    expect(saved.before.headingCount).toBeGreaterThan(0);
    expect(saved.after.nativeTables).toBe(1);
    expect(saved.after.callouts).toBeGreaterThan(0);
    expect(saved.likelyChanges.join(" ")).toContain("native table");
    expect(saved.confirmationRequired.join(" ")).toContain("Dry-run only");
  });
});

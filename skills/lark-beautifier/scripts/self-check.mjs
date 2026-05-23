#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const dir = join(tmpdir(), `lark-beautifier-${Date.now()}`);
const input = join(dir, "input.md");
const output = join(dir, "output.md");

await mkdir(dir, { recursive: true });
await writeFile(input, [
  "# 测试文档",
  "",
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
].join("\n"), "utf8");

const result = spawnSync(process.execPath, [
  fileURLToPath(new URL("./beautify.mjs", import.meta.url)),
  "--mode",
  "structured",
  input,
  "--output",
  output
], {
  encoding: "utf8"
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const actual = await readFile(output, "utf8");
const checks = {
  callout: actual.includes("<callout"),
  table: actual.includes("<lark-table"),
  enhancement: actual.includes("视觉增强建议")
};

console.log(JSON.stringify({
  ok: Object.values(checks).every(Boolean),
  checks
}, null, 2));

await rm(dir, { recursive: true, force: true });

if (!Object.values(checks).every(Boolean)) {
  process.exit(1);
}

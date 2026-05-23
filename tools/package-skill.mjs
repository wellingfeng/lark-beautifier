#!/usr/bin/env node
import { mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const releaseDir = resolve("release");
const zipPath = resolve(releaseDir, "lark-beautifier-skill.zip");

await mkdir(releaseDir, { recursive: true });
await rm(zipPath, { force: true });

const command = process.platform === "win32"
  ? ["powershell.exe", [
      "-NoProfile",
      "-Command",
      "Compress-Archive -Path 'skills/lark-beautifier','.claude/skills/lark-beautifier','README.md','README.zh-CN.md','LICENSE' -DestinationPath 'release/lark-beautifier-skill.zip' -Force"
    ]]
  : ["zip", [
      "-r",
      zipPath,
      "skills/lark-beautifier",
      ".claude/skills/lark-beautifier",
      "README.md",
      "README.zh-CN.md",
      "LICENSE"
    ]];

const result = spawnSync(command[0], command[1], { stdio: "inherit" });
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Created ${zipPath}`);

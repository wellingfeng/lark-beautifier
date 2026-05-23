#!/usr/bin/env node
import { cp, rm } from "node:fs/promises";

const source = "skills/lark-beautifier";
const targets = [".claude/skills/lark-beautifier"];

for (const target of targets) {
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true });
  console.log(`Synced ${source} -> ${target}`);
}

#!/usr/bin/env node
import { cp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const sourceRoot = "skills";
const targetRoot = ".claude/skills";
const skillNames = (await readdir(sourceRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const skillName of skillNames) {
  const source = join(sourceRoot, skillName);
  const target = join(targetRoot, skillName);
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true });
  console.log(`Synced ${source} -> ${target}`);
}

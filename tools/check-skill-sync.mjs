#!/usr/bin/env node
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const pairs = [
  {
    name: "Claude Code",
    source: "skills/lark-beautifier",
    target: ".claude/skills/lark-beautifier"
  }
];

const mismatches = [];

for (const pair of pairs) {
  const sourceFiles = await listFiles(pair.source);
  const targetFiles = await listFiles(pair.target);
  const allFiles = new Set([...sourceFiles, ...targetFiles]);

  for (const file of allFiles) {
    if (!sourceFiles.includes(file)) {
      mismatches.push(`Only in ${pair.name} skill: ${file}`);
      continue;
    }
    if (!targetFiles.includes(file)) {
      mismatches.push(`Missing from ${pair.name} skill: ${file}`);
      continue;
    }

    const [sourceContent, targetContent] = await Promise.all([
      readFile(join(pair.source, file), "utf8"),
      readFile(join(pair.target, file), "utf8")
    ]);
    if (sourceContent !== targetContent) {
      mismatches.push(`Different ${pair.name} skill content: ${file}`);
    }
  }
}

if (mismatches.length) {
  console.error(mismatches.join("\n"));
  process.exit(1);
}

console.log("Skill copies are synchronized.");

async function listFiles(root) {
  const output = [];
  await walk(root, root, output);
  return output.sort();
}

async function walk(root, dir, output) {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      await walk(root, fullPath, output);
    } else if (info.isFile()) {
      output.push(relative(root, fullPath).replace(/\\/g, "/"));
    }
  }
}

#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const repoRoot = resolve(skillDir, "..", "..");
const cliSource = resolve(repoRoot, "src", "cli.ts");
const cliBuild = resolve(repoRoot, "dist", "cli.js");

if (existsSync(cliSource) || existsSync(cliBuild)) {
  const status = runRepositoryCli();
  process.exit(status);
}

const options = parseArgs(process.argv.slice(2));
const input = await readFile(resolve(options.input), "utf8");
const output = beautifyStandalone(input, options);

if (options.check) {
  const changed = normalize(input).trimEnd() !== output.trimEnd();
  if (changed) {
    console.error(`${options.input} would be changed by lark-beautifier.`);
    process.exit(1);
  }
  process.exit(0);
}

if (options.output) {
  const outputPath = resolve(options.output);
  await writeFile(outputPath, output, "utf8");
  if (options.toLarkCli) {
    console.log(`lark-cli docs +create --markdown "${escapeForDoubleQuotes(outputPath)}"`);
  }
} else {
  process.stdout.write(output);
}

function runRepositoryCli() {
  if (!existsSync(resolve(repoRoot, "node_modules"))) {
    const install = spawnSync("npm", ["install"], {
      cwd: repoRoot,
      stdio: "inherit",
      shell: process.platform === "win32"
    });
    if (install.status !== 0) {
      return install.status ?? 1;
    }
  }

  const args = process.argv.slice(2);
  const command = existsSync(cliSource)
    ? ["npx", ["tsx", cliSource, ...args]]
    : ["node", [cliBuild, ...args]];

  const result = spawnSync(command[0], command[1], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  return result.status ?? 1;
}

function parseArgs(args) {
  const options = {
    input: undefined,
    output: undefined,
    mode: undefined,
    callouts: "auto",
    grids: "auto",
    tables: "smart",
    whiteboards: "suggest",
    enhancements: "off",
    conservative: false,
    check: false,
    toLarkCli: false
  };
  const explicit = new Set();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-o" || arg === "--output") {
      options.output = args[++index];
    } else if (arg === "--mode") {
      options.mode = parseEnum(args[++index], ["safe", "structured", "bold"], "--mode");
    } else if (arg === "--callouts") {
      options.callouts = args[++index];
      explicit.add("callouts");
    } else if (arg === "--grids") {
      options.grids = args[++index];
      explicit.add("grids");
    } else if (arg === "--tables") {
      options.tables = args[++index];
      explicit.add("tables");
    } else if (arg === "--whiteboards") {
      options.whiteboards = args[++index];
      explicit.add("whiteboards");
    } else if (arg === "--enhancements") {
      options.enhancements = args[++index];
      explicit.add("enhancements");
    } else if (arg === "--conservative") {
      options.conservative = true;
      explicit.add("conservative");
    } else if (arg === "--check") {
      options.check = true;
    } else if (arg === "--to-lark-cli") {
      options.toLarkCli = true;
    } else if (arg === "--theme") {
      options.theme = args[++index];
      console.error("Note: --theme is ignored in standalone mode; install the TypeScript CLI to apply themes.");
    } else if (arg === "--components") {
      options.components = args[++index];
      console.error("Note: --components is ignored in standalone mode; install the TypeScript CLI for component injection.");
    } else if (arg === "--visual-density") {
      options.visualDensity = args[++index];
      console.error("Note: --visual-density is ignored in standalone mode; install the TypeScript CLI to control component density.");
    } else if (arg === "--analyze") {
      options.analyze = true;
      console.error("Note: --analyze is ignored in standalone mode; install the TypeScript CLI to emit SignalReport JSON.");
    } else if (arg === "--diff") {
      console.error("Standalone skill mode does not support --diff. Install the full npm package for diff output.");
      process.exit(2);
    } else if (arg.startsWith("-")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    } else if (!options.input) {
      options.input = arg;
    } else {
      console.error(`Unexpected argument: ${arg}`);
      process.exit(2);
    }
  }

  if (!options.input) {
    console.error("Usage: node scripts/beautify.mjs <input.md> [-o output.md]");
    process.exit(2);
  }

  applyMode(options, explicit);

  if (options.conservative) {
    if (options.callouts === "auto") options.callouts = "conservative";
    if (options.grids === "auto") options.grids = "conservative";
    if (options.enhancements === "draft") options.enhancements = "suggest";
  }

  return options;
}

function applyMode(options, explicit) {
  if (!options.mode) return;
  if (options.mode === "safe") {
    if (!explicit.has("callouts")) options.callouts = "conservative";
    if (!explicit.has("grids")) options.grids = "off";
    if (!explicit.has("tables")) options.tables = "markdown";
    if (!explicit.has("whiteboards")) options.whiteboards = "off";
    if (!explicit.has("enhancements")) options.enhancements = "off";
    if (!explicit.has("conservative")) options.conservative = true;
    return;
  }
  if (options.mode === "structured") {
    if (!explicit.has("callouts")) options.callouts = "auto";
    if (!explicit.has("grids")) options.grids = "auto";
    if (!explicit.has("tables")) options.tables = "smart";
    if (!explicit.has("whiteboards")) options.whiteboards = "suggest";
    if (!explicit.has("enhancements")) options.enhancements = "suggest";
    if (!explicit.has("conservative")) options.conservative = false;
    return;
  }
  if (options.mode === "bold") {
    if (!explicit.has("callouts")) options.callouts = "auto";
    if (!explicit.has("grids")) options.grids = "auto";
    if (!explicit.has("tables")) options.tables = "lark";
    if (!explicit.has("whiteboards")) options.whiteboards = "suggest";
    if (!explicit.has("enhancements")) options.enhancements = "draft";
    if (!explicit.has("conservative")) options.conservative = false;
  }
}

function parseEnum(value, allowed, optionName) {
  if (allowed.includes(value)) return value;
  console.error(`${optionName} must be one of: ${allowed.join(", ")}`);
  process.exit(2);
}

function beautifyStandalone(input, options) {
  const { frontmatter, body } = splitFrontmatter(normalize(input));
  const blocks = splitBlocks(body);
  const transformed = [];
  const usedEnhancementKinds = new Set();

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (isFence(block) || isRawLarkBlock(block)) {
      transformed.push(block);
      continue;
    }

    const grid = maybeGrid(blocks, index, options);
    if (grid) {
      transformed.push(grid.markdown);
      index = grid.nextIndex - 1;
      continue;
    }

    const calloutBlocks = maybeCalloutBlocks(block, options);
    if (calloutBlocks) {
      transformed.push(...calloutBlocks);
      continue;
    }

    const table = maybeTable(block, blocks[index - 1] ?? "", options);
    if (table) {
      transformed.push(table);
      continue;
    }

    transformed.push(formatBlockTypography(block));

    const whiteboard = maybeWhiteboard(block, options);
    if (whiteboard) {
      transformed.push(whiteboard);
    }

    const enhancement = maybeEnhancement(block, options, usedEnhancementKinds);
    if (enhancement) {
      transformed.push(enhancement);
    }
  }

  const content = transformed.filter((block) => block.trim().length > 0).join("\n\n").trimEnd();
  return `${frontmatter ? `${frontmatter}\n\n` : ""}${content}\n`;
}

function splitFrontmatter(input) {
  const match = input.match(/^---\n[\s\S]*?\n---(?:\n|$)/);
  if (!match) return { body: input };
  return { frontmatter: match[0].trimEnd(), body: input.slice(match[0].length) };
}

function splitBlocks(input) {
  const lines = input.split("\n");
  const blocks = [];
  let current = [];
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      current.push(line);
      inFence = !inFence;
      if (!inFence) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }

    if (!inFence && line.trim() === "") {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) blocks.push(current.join("\n"));
  return blocks;
}

function maybeCalloutBlocks(block, options) {
  if (options.callouts === "off") return undefined;
  const normalized = block.replace(/^>\s?/gm, "").trim();
  const rule = [
    [/(注意|提示|建议|说明)[:：]\s*/, /^(注意|提示|建议|说明)[:：]\s*/, "💡", "light-blue", "blue"],
    [/(结论|推荐|结果)[:：]\s*/, /^(结论|推荐|结果)[:：]\s*/, "✅", "light-green", "green"],
    [/(风险|警告|危险)[:：]\s*/, /^(风险|警告|危险)[:：]\s*/, "⚠️", "light-red", "red"],
    [/(重点|关键)[:：]\s*/, /^(重点|关键)[:：]\s*/, "📌", "light-yellow", "yellow"]
  ].find(([pattern]) => pattern.test(normalized));

  if (!rule) return undefined;
  const [pattern, anchoredPattern, emoji, background, border] = rule;
  const match = normalized.match(pattern);
  const matchIndex = match?.index ?? -1;
  if (matchIndex > 0 && !/[。！？；;.!?]\s*$/.test(normalized.slice(0, matchIndex))) return undefined;
  if (options.callouts === "conservative" && normalized.length > 180) return undefined;

  const prefix = matchIndex > 0 ? normalized.slice(0, matchIndex).trim() : "";
  const body = formatBlockTypography(normalized.slice(matchIndex).replace(anchoredPattern, "").trim());
  const callout = `<callout emoji="${emoji}" background-color="${background}" border-color="${border}">\n${body}\n</callout>`;
  return prefix ? [formatBlockTypography(prefix), callout] : [callout];
}

function maybeGrid(blocks, index, options) {
  if (options.grids === "off") return undefined;
  const firstHeading = parseGridHeading(blocks[index]);
  const secondHeading = parseGridHeading(blocks[index + 2]);
  if (!firstHeading || !secondHeading) return undefined;
  if (!isGridPair(firstHeading.title, secondHeading.title)) return undefined;
  const firstBody = blocks[index + 1];
  const secondBody = blocks[index + 3];
  if (!firstBody || !secondBody || /^#{1,6}\s/.test(firstBody) || /^#{1,6}\s/.test(secondBody)) return undefined;
  if (options.grids === "conservative" && (firstBody.length > 240 || secondBody.length > 240)) return undefined;

  return {
    nextIndex: index + 4,
    markdown: [
      '<grid cols="2">',
      '<column>',
      '',
      `**${firstHeading.title}**`,
      '',
      formatBlockTypography(firstBody),
      '',
      '</column>',
      '<column>',
      '',
      `**${secondHeading.title}**`,
      '',
      formatBlockTypography(secondBody),
      '',
      '</column>',
      '</grid>'
    ].join("\n")
  };
}

function maybeTable(block, previousBlock, options) {
  if (options.tables === "markdown") return undefined;
  const lines = block.split("\n");
  if (lines.length < 3 || !lines.every((line) => /^\s*\|.*\|\s*$/.test(line))) return undefined;
  const rows = lines.map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => formatInlineTypography(cell.trim())));
  if (!/^:?-{3,}:?$/.test(rows[1][0] ?? "")) return undefined;
  const header = rows[0];
  const body = rows.slice(2);
  const context = `${previousBlock} ${header.join(" ")} ${body.flat().join(" ")}`;
  const complex = options.tables === "lark" || header.length >= 5 || body.flat().some((cell) => cell.length >= 42) || /决策|风险|排期|计划|负责人|优先级|矩阵/.test(context);
  if (!complex) return undefined;
  const widths = header.map((cell) => Math.max(120, Math.min(280, cell.length * 18 + 80))).join(",");

  return [
    `<lark-table column-widths="${widths}" header-row="true">`,
    "<lark-tr>",
    ...header.map((cell) => `<lark-td>\n**${escapeHtml(cell)}**\n</lark-td>`),
    "</lark-tr>",
    ...body.flatMap((row) => [
      "<lark-tr>",
      ...row.map((cell) => `<lark-td>\n${escapeHtml(cell)}\n</lark-td>`),
      "</lark-tr>"
    ]),
    "</lark-table>"
  ].join("\n");
}

function maybeWhiteboard(block, options) {
  if (options.whiteboards === "off" || !/^#{1,6}\s/.test(block)) return undefined;
  const title = block.replace(/^#{1,6}\s*/, "").trim();
  if (!/架构图|流程图|时间线|组织结构|因果分析|系统依赖|依赖关系|泳道图|拓扑/.test(title)) return undefined;
  if (options.whiteboards === "insert-blank") {
    return `<whiteboard type="blank" title="${escapeHtml(title)}"></whiteboard>`;
  }
  return `<callout emoji="🧩" background-color="light-yellow" border-color="yellow">\n建议为“${title}”补充飞书画板，后续可用 lark-whiteboard-cli 生成真实图示。\n</callout>`;
}

function maybeEnhancement(block, options, usedKinds) {
  if (options.enhancements === "off" || !/^#{1,6}\s/.test(block)) return undefined;
  const title = block.replace(/^#{1,6}\s*/, "").trim();
  const rule = [
    {
      kind: "diagram",
      test: /流程|路径|链路|步骤|审批|流转|SOP/i,
      label: "视觉增强建议：流程图",
      rationale: "这个小节更适合用流程图呈现，读者可以先看全链路，再回到正文理解细节。",
      actions: [
        "先让用户确认是否允许把正文步骤重构为图示。",
        "确认后优先生成 Mermaid 或飞书画板；如果要写回飞书，再用 lark-whiteboard-cli 或 lark-whiteboard。"
      ],
      artifact: `flowchart TD\n  A[开始：${title}] --> B[关键步骤]\n  B --> C{是否满足条件}\n  C -- 是 --> D[进入下一阶段]\n  C -- 否 --> E[补充信息后重试]`
    },
    {
      kind: "diagram",
      test: /架构|依赖|拓扑|模块|系统|服务|组件|集成/i,
      label: "视觉增强建议：架构图",
      rationale: "架构和依赖内容只靠段落很难扫读，适合补一张组件关系图或飞书画板。",
      actions: ["先确认是否允许根据正文抽取模块和关系。", "确认后生成组件图；不要凭空新增系统、服务或依赖。"],
      artifact: `flowchart LR\n  U[用户/读者] --> A[${title}]\n  A --> B[模块 A]\n  A --> C[模块 B]\n  B --> D[外部依赖]`
    },
    {
      kind: "chart",
      test: /指标|数据|增长|下降|占比|转化|成本|收益|趋势|对比|矩阵/i,
      label: "视觉增强建议：图表",
      rationale: "包含指标、趋势或对比时，图表比纯文本更利于判断重点和异常。",
      actions: ["先确认是否允许从正文或表格抽取数据。", "确认后再生成柱状图、折线图或对比表；缺失数据必须标注为待补充。"],
      artifact: `xychart-beta\n  title "${title}"\n  x-axis ["A", "B", "C"]\n  y-axis "数值" 0 --> 100\n  bar [30, 55, 80]`
    },
    {
      kind: "image",
      test: /封面|配图|小红书|海报|活动|案例|故事|品牌|宣传/i,
      label: "视觉增强建议：封面/配图",
      rationale: "面向传播或活动的内容可以加封面、段首图或小红书风格卡片，提高第一屏吸引力。",
      actions: [
        "先确认视觉风格、尺寸和是否可以生成或引用图片。",
        "确认后可使用 baoyu-xhs-images 生成小红书卡片，或用 imagegen 生成真实位图，再上传到飞书。"
      ],
      artifact: "baoyu-xhs-images prompt: 提炼本文核心观点，生成 3 张小红书信息卡；风格清爽、标题短、每张不超过 3 个要点，保留事实边界。"
    },
    {
      kind: "layout",
      test: /摘要|TL;DR|结论|行动项|负责人|排期|里程碑|路线图|复盘/i,
      label: "视觉增强建议：阅读版式",
      rationale: "摘要、行动项和里程碑适合独立成卡片或时间线，能减少长文读者的定位成本。",
      actions: ["先确认是否允许移动段落顺序或新增摘要区。", "确认后再拆成概览卡、行动项表或时间线；默认只保留建议，不改正文结构。"],
      artifact: `timeline\n  title ${title}\n  阶段一 : 待从正文确认\n  阶段二 : 待从正文确认\n  阶段三 : 待从正文确认`
    }
  ].find((candidate) => !usedKinds.has(candidate.kind) && candidate.test.test(title));

  if (!rule) return undefined;
  usedKinds.add(rule.kind);
  const lines = [
    '<callout emoji="🎨" background-color="light-purple" border-color="purple">',
    `**${rule.label}（${title}）**`,
    "",
    rule.rationale,
    "",
    ...rule.actions.map((action) => `- ${action}`)
  ];
  if (options.enhancements === "draft") {
    const fence = rule.label.includes("封面/配图") ? "text" : "mermaid";
    lines.push("", `\`\`\`${fence}`, rule.artifact, "```");
  }
  lines.push("</callout>");
  return lines.join("\n");
}

function parseGridHeading(block) {
  const match = block?.match(/^#{3,6}\s+(.+?)\s*$/);
  return match ? { title: match[1].trim().replace(/\s+/g, " ") } : undefined;
}

function isGridPair(left, right) {
  return [
    ["优点", "缺点"],
    ["推荐", "不推荐"],
    ["现在", "未来"],
    ["方案 A", "方案 B"],
    ["方案A", "方案B"],
    ["Before", "After"]
  ].some(([a, b]) => left === a && right === b);
}

function formatBlockTypography(block) {
  if (/^```/.test(block.trim()) || isRawLarkBlock(block)) return block;
  return block
    .split("\n")
    .map((line) => formatInlineTypography(line))
    .join("\n");
}

function formatInlineTypography(line) {
  const protectedParts = [];
  const tokenized = line.replace(/(`[^`]*`|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\)|https?:\/\/\S+)/g, (part) => {
    const token = `\u0000${protectedParts.length}\u0000`;
    protectedParts.push(part);
    return token;
  });

  const formatted = tokenized
    .replace(/[ \t]{2,}/g, " ")
    .replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2")
    .replace(/([\u4e00-\u9fff])[,]/g, "$1，")
    .replace(/([\u4e00-\u9fff])[?]/g, "$1？")
    .replace(/([\u4e00-\u9fff])[!]/g, "$1！")
    .replace(/([\u4e00-\u9fff])[:]/g, "$1：")
    .replace(/([\u4e00-\u9fff])[;]/g, "$1；");

  return formatted.replace(/\u0000(\d+)\u0000/g, (_, index) => protectedParts[Number(index)]);
}

function isFence(block) {
  return /^```/.test(block.trim());
}

function isRawLarkBlock(block) {
  return /^<\/?(callout|grid|column|lark-table|whiteboard)\b/i.test(block.trim());
}

function normalize(value) {
  return value.replace(/\r\n/g, "\n");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeForDoubleQuotes(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

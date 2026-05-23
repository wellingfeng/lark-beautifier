#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const args = parseArgs(process.argv.slice(2));

if (!args.left || !args.right) {
  fail("Usage: align-compare.mjs --left raw.md --right beautified.md --out-html tmp/compare.html [--out-png tmp/compare.png]");
}

const leftText = await readFile(args.left, "utf8");
const rightText = await readFile(args.right, "utf8");
const leftBlocks = parseBlocks(leftText, "left");
const rightBlocks = parseBlocks(rightText, "right");
const rows = alignBlocks(leftBlocks, rightBlocks);
const stats = summarize(rows);
const mode = args.mode === "rows" ? "rows" : "soft";
const htmlOptions = {
  leftTitle: args["left-title"] ?? "Left",
  rightTitle: args["right-title"] ?? "Right",
  leftSource: args.left,
  rightSource: args.right,
  rows,
  stats,
  thresholdPx: Number(args["align-threshold-px"] ?? 700),
  targetResidualPx: Number(args["target-residual-px"] ?? 32),
  minAnchorChars: Number(args["min-anchor-chars"] ?? 120),
  showSpacers: Boolean(args["show-spacers"])
};
const html = mode === "rows" ? renderRowsHtml(htmlOptions) : renderSoftHtml(htmlOptions);

const outHtml = args["out-html"] ?? "tmp/aligned-compare.html";
await mkdir(dirname(resolve(outHtml)), { recursive: true });
await writeFile(outHtml, html, "utf8");

let screenshotStats = null;
if (args["out-png"]) {
  screenshotStats = await screenshotHtml(outHtml, args["out-png"], mode);
}

console.log(JSON.stringify({ ok: true, mode, outHtml, outPng: args["out-png"] ?? null, stats, screenshotStats }, null, 2));

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseBlocks(markdown, side) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    if (!lines[i].trim()) {
      i += 1;
      continue;
    }

    const line = lines[i];
    if (/^```/.test(line.trim())) {
      const buf = [line];
      i += 1;
      while (i < lines.length) {
        buf.push(lines[i]);
        if (/^```/.test(lines[i].trim())) {
          i += 1;
          break;
        }
        i += 1;
      }
      blocks.push(makeBlock("code", buf.join("\n"), side));
      continue;
    }

    const xmlStart = line.trim().match(/^<(callout|lark-table|grid|whiteboard|image)\b/i);
    if (xmlStart) {
      const tag = xmlStart[1].toLowerCase();
      const buf = [line];
      i += 1;
      if (!/\/>$/.test(line.trim()) && !line.trim().includes(`</${tag}>`)) {
        while (i < lines.length) {
          buf.push(lines[i]);
          if (lines[i].trim().includes(`</${tag}>`)) {
            i += 1;
            break;
          }
          i += 1;
        }
      }
      blocks.push(makeBlock(tag === "callout" ? "callout" : tag === "lark-table" ? "table" : "visual", buf.join("\n"), side));
      continue;
    }

    if (/^---+\s*$/.test(line.trim())) {
      blocks.push(makeBlock("visual", line, side));
      i += 1;
      continue;
    }

    if (/^!\[[^\]]*]\([^)]+\)\s*$/.test(line.trim())) {
      blocks.push(makeBlock("image", line.trim(), side));
      i += 1;
      continue;
    }

    if (/^#{1,6}\s+/.test(line.trim())) {
      blocks.push(makeBlock("heading", line.trim(), side));
      i += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && (/^\s*[-*+]\s+/.test(lines[i]) || /^\s*\d+[.)]\s+/.test(lines[i]) || !lines[i].trim())) {
        buf.push(lines[i]);
        i += 1;
      }
      blocks.push(makeBlock("list", buf.join("\n"), side));
      continue;
    }

    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const buf = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      blocks.push(makeBlock("table", buf.join("\n"), side));
      continue;
    }

    const buf = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !startsSpecial(lines[i])) {
      buf.push(lines[i]);
      i += 1;
    }
    blocks.push(makeBlock("paragraph", buf.join("\n"), side));
  }

  return blocks.filter((block) => block.normalized.length > 0 || block.type === "visual" || block.type === "image");
}

function startsSpecial(line) {
  const trimmed = line.trim();
  return /^```/.test(trimmed)
    || /^#{1,6}\s+/.test(trimmed)
    || /^!\[[^\]]*]\([^)]+\)\s*$/.test(trimmed)
    || /^<(callout|lark-table|grid|whiteboard|image)\b/i.test(trimmed)
    || /^---+\s*$/.test(trimmed)
    || /^\s*[-*+]\s+/.test(line)
    || /^\s*\d+[.)]\s+/.test(line)
    || /^\s*\|/.test(line);
}

function makeBlock(type, raw, side) {
  const text = stripMarkup(raw);
  const normalized = normalize(text);
  return {
    type,
    raw,
    text,
    normalized,
    side,
    tokens: tokenize(normalized)
  };
}

function stripMarkup(raw) {
  return raw
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```[a-zA-Z0-9_-]*/g, "").replace(/```/g, ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_~`>#|]/g, " ")
    .replace(/[-+]\s+/g, " ")
    .trim();
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[，。！？；：、（）【】《》“”‘’]/g, " ")
    .replace(/[^\p{L}\p{N}_./+-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(normalized) {
  if (!normalized) return new Set();
  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const tokens = new Set(rawTokens);
  for (const token of rawTokens) {
    if (/[\u3400-\u9fff]/u.test(token) && token.length > 2) {
      for (let i = 0; i < token.length - 1; i += 1) {
        tokens.add(token.slice(i, i + 2));
      }
    }
  }
  return tokens;
}

function alignBlocks(left, right) {
  const n = left.length;
  const m = right.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  const move = Array.from({ length: n + 1 }, () => Array(m + 1).fill(""));
  const gapPenalty = -0.16;

  for (let i = 1; i <= n; i += 1) {
    dp[i][0] = dp[i - 1][0] + gapPenalty;
    move[i][0] = "up";
  }
  for (let j = 1; j <= m; j += 1) {
    dp[0][j] = dp[0][j - 1] + gapPenalty;
    move[0][j] = "left";
  }

  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const score = matchScore(left[i - 1], right[j - 1]);
      const match = dp[i - 1][j - 1] + (score >= 0.42 ? score : -0.28);
      const del = dp[i - 1][j] + gapPenalty;
      const ins = dp[i][j - 1] + gapPenalty;
      if (match >= del && match >= ins) {
        dp[i][j] = match;
        move[i][j] = "diag";
      } else if (del >= ins) {
        dp[i][j] = del;
        move[i][j] = "up";
      } else {
        dp[i][j] = ins;
        move[i][j] = "left";
      }
    }
  }

  const rows = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const step = move[i][j];
    if (step === "diag") {
      const score = matchScore(left[i - 1], right[j - 1]);
      if (score >= 0.42) {
        rows.push({ kind: score >= 0.75 ? "matched" : "weak", left: left[i - 1], right: right[j - 1], score });
      } else {
        rows.push({ kind: "right-only", left: null, right: right[j - 1], score: 0 });
        rows.push({ kind: "left-only", left: left[i - 1], right: null, score: 0 });
      }
      i -= 1;
      j -= 1;
    } else if (step === "up" || j === 0) {
      rows.push({ kind: "left-only", left: left[i - 1], right: null, score: 0 });
      i -= 1;
    } else {
      rows.push({ kind: "right-only", left: null, right: right[j - 1], score: 0 });
      j -= 1;
    }
  }
  return rows.reverse();
}

function matchScore(a, b) {
  if (!a.normalized || !b.normalized) return 0;
  if (a.normalized === b.normalized) return 1.2;
  if (a.type === "visual" || b.type === "visual") return 0;

  const lenRatio = Math.min(a.normalized.length, b.normalized.length) / Math.max(a.normalized.length, b.normalized.length);
  if (lenRatio < 0.28) return 0;

  let intersection = 0;
  for (const token of a.tokens) {
    if (b.tokens.has(token)) intersection += 1;
  }
  const union = new Set([...a.tokens, ...b.tokens]).size || 1;
  const jaccard = intersection / union;

  let substring = 0;
  if (a.normalized.includes(b.normalized) || b.normalized.includes(a.normalized)) {
    substring = 0.7 * lenRatio;
  }

  const typeBonus = a.type === b.type ? 0.12 : a.type === "callout" || b.type === "callout" ? 0.02 : 0;
  const headingBonus = a.type === "heading" && b.type === "heading" && prefixToken(a.normalized) === prefixToken(b.normalized) ? 0.2 : 0;
  return Math.max(jaccard, substring) + typeBonus + headingBonus;
}

function prefixToken(text) {
  return text.split(/\s+/)[0] ?? "";
}

function summarize(rows) {
  return {
    rows: rows.length,
    matched: rows.filter((row) => row.kind === "matched").length,
    weak: rows.filter((row) => row.kind === "weak").length,
    leftOnly: rows.filter((row) => row.kind === "left-only").length,
    rightOnly: rows.filter((row) => row.kind === "right-only").length
  };
}

function renderSoftHtml(options) {
  const { leftTitle, rightTitle, leftSource, rightSource, rows, stats, thresholdPx, targetResidualPx, minAnchorChars, showSpacers } = options;
  const { leftItems, rightItems, anchorCount } = buildSoftStreams(rows, minAnchorChars);

  return `<!doctype html>
<html lang="zh-CN" data-align-threshold-px="${thresholdPx}" data-target-residual-px="${targetResidualPx}" data-show-spacers="${showSpacers ? "true" : "false"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Soft Aligned Screenshot Compare</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #eef2f7; color: #1f2937; font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; }
  .top { background: #0f172a; color: white; padding: 16px 28px; }
  .top h1 { margin: 0 0 6px; font-size: 20px; font-weight: 700; }
  .top p { margin: 0; color: #cbd5e1; font-size: 12px; }
  .compare { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 26px; padding: 22px 28px 40px; align-items: start; }
  .panel { background: #fff; border: 1px solid #dbe3ee; box-shadow: 0 6px 24px rgb(15 23 42 / 8%); }
  .panel-title { position: sticky; top: 0; z-index: 2; background: #f8fafc; border-bottom: 1px solid #dbe3ee; padding: 14px 22px; font-weight: 700; color: #0f172a; }
  .doc { padding: 22px 30px 36px; }
  .doc-block { margin: 0 0 16px; }
  .doc-block.heading { margin-top: 26px; margin-bottom: 12px; }
  .doc-block.heading:first-child { margin-top: 0; }
  h1, h2, h3, h4 { margin: 0; line-height: 1.35; color: #111827; }
  h1 { font-size: 24px; }
  h2 { font-size: 20px; padding-top: 4px; }
  h3 { font-size: 16px; color: #1f2937; }
  h4 { font-size: 14px; color: #374151; }
  p { margin: 0 0 10px; line-height: 1.76; font-size: 13px; }
  ul, ol { margin: 0 0 12px 22px; padding: 0; line-height: 1.7; font-size: 13px; }
  pre { margin: 0 0 14px; padding: 12px 14px; overflow: auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-family: Consolas, "Courier New", monospace; font-size: 11px; line-height: 1.55; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 14px; font-size: 12px; }
  th, td { border: 1px solid #dbe3ee; padding: 7px 8px; vertical-align: top; }
  th { background: #f1f5f9; text-align: left; }
  .callout { margin: 0 0 16px; padding: 13px 15px; border-left: 5px solid #2563eb; background: #eff6ff; border-radius: 8px; }
  .grid { display: grid; gap: 10px; margin: 0 0 16px; }
  .grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .grid-card { padding: 12px; border: 1px solid #dbe3ee; border-radius: 8px; background: #f8fafc; font-size: 12px; line-height: 1.55; }
  .grid-card strong { color: #0f172a; }
  .visual { margin: 0 0 16px; min-height: 72px; padding: 14px; border: 1px dashed #b6c2d2; background: #f8fafc; border-radius: 8px; color: #64748b; font-size: 12px; display: flex; align-items: center; justify-content: center; text-align: center; }
  .image { margin: 0 0 16px; }
  .image img { display: block; width: 100%; max-height: 280px; object-fit: contain; border: 1px solid #dbe3ee; border-radius: 8px; background: #f8fafc; }
  .image .caption { margin: 7px 0 0; color: #64748b; font-size: 11px; text-align: center; }
  .rule { height: 1px; background: #dbe3ee; margin: 22px 0; }
  .align-spacer { margin: 0; padding: 0; background: transparent; }
  html[data-show-spacers="true"] .align-spacer { background: repeating-linear-gradient(-45deg, rgb(37 99 235 / 8%), rgb(37 99 235 / 8%) 8px, transparent 8px, transparent 16px); border: 1px dashed rgb(37 99 235 / 25%); }
  html[data-show-spacers="true"] .align-spacer::after { content: attr(data-label); display: block; padding: 4px 8px; color: #2563eb; font-size: 11px; }
</style>
</head>
<body>
  <header class="top">
    <h1>Soft-Aligned Screenshot Compare</h1>
    <p>${escapeHtml(leftSource)} ↔ ${escapeHtml(rightSource)} | rows ${stats.rows}, matched ${stats.matched}, right-only ${stats.rightOnly}, anchors ${anchorCount}. Only large drift triggers blank spacers.</p>
  </header>
  <main class="compare">
    <section class="panel"><div class="panel-title">${escapeHtml(leftTitle)}</div><article class="doc left-doc">${leftItems.map(renderDocItem).join("\n")}</article></section>
    <section class="panel"><div class="panel-title">${escapeHtml(rightTitle)}</div><article class="doc right-doc">${rightItems.map(renderDocItem).join("\n")}</article></section>
  </main>
  <script>
    window.__alignmentDone = false;
    window.__alignmentStats = null;
    function applySoftAlignment() {
      document.querySelectorAll(".align-spacer").forEach((node) => node.remove());
      const threshold = Number(document.documentElement.dataset.alignThresholdPx || 700);
      const residual = Number(document.documentElement.dataset.targetResidualPx || 32);
      const leftAnchors = Array.from(document.querySelectorAll(".left-doc [data-pair]"));
      let spacerCount = 0;
      let totalSpacerPx = 0;
      let maxDriftPx = 0;
      for (const left of leftAnchors) {
        const pair = left.dataset.pair;
        const right = document.querySelector('.right-doc [data-pair="' + pair + '"]');
        if (!right) continue;
        const delta = left.getBoundingClientRect().top - right.getBoundingClientRect().top;
        maxDriftPx = Math.max(maxDriftPx, Math.abs(delta));
        if (Math.abs(delta) <= threshold) continue;
        const target = delta < 0 ? left : right;
        const side = delta < 0 ? "left" : "right";
        const amount = Math.max(0, Math.round(Math.abs(delta) - residual));
        if (amount <= 0) continue;
        const spacer = document.createElement("div");
        spacer.className = "align-spacer";
        spacer.style.height = amount + "px";
        spacer.dataset.label = side + " spacer " + amount + "px";
        target.parentElement.insertBefore(spacer, target);
        spacerCount += 1;
        totalSpacerPx += amount;
      }
      window.__alignmentStats = { thresholdPx: threshold, targetResidualPx: residual, spacerCount, totalSpacerPx, maxDriftPx: Math.round(maxDriftPx) };
      window.__alignmentDone = true;
    }
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(() => requestAnimationFrame(() => setTimeout(applySoftAlignment, 50)));
  </script>
</body>
</html>`;
}

function buildSoftStreams(rows, minAnchorChars) {
  const leftItems = [];
  const rightItems = [];
  let pairIndex = 0;
  let anchorCount = 0;
  for (const row of rows) {
    const pair = shouldAnchor(row, minAnchorChars) ? `p${++pairIndex}` : undefined;
    if (pair) anchorCount += 1;
    if (row.left) leftItems.push({ block: row.left, pair });
    if (row.right) rightItems.push({ block: row.right, pair });
  }
  return { leftItems, rightItems, anchorCount };
}

function shouldAnchor(row, minAnchorChars) {
  if (!row.left || !row.right) return false;
  if (row.score < 0.75) return false;
  if (row.left.type === "heading" || row.right.type === "heading") return true;
  if (row.left.type === "code" || row.left.type === "table") return true;
  return Math.min(row.left.normalized.length, row.right.normalized.length) >= minAnchorChars;
}

function renderDocItem(item) {
  const pair = item.pair ? ` data-pair="${escapeHtml(item.pair)}"` : "";
  return renderDocBlock(item.block, pair);
}

function renderDocBlock(block, pairAttr = "") {
  if (block.type === "heading") {
    const level = Math.min(Math.max((block.raw.match(/^#+/)?.[0].length ?? 2), 1), 4);
    return `<div class="doc-block heading"${pairAttr}><h${level}>${escapeHtml(block.raw.replace(/^#+\s*/, ""))}</h${level}></div>`;
  }
  if (block.type === "code") {
    return `<div class="doc-block code"${pairAttr}><pre>${escapeHtml(block.raw)}</pre></div>`;
  }
  if (block.type === "callout") {
    return `<div class="doc-block callout"${pairAttr}>${paragraphs(block.text)}</div>`;
  }
  if (block.type === "image") {
    return renderImage(block.raw, pairAttr);
  }
  if (block.type === "visual") {
    if (/^---+\s*$/.test(block.raw.trim())) return `<div class="doc-block rule"${pairAttr}></div>`;
    if (/^<grid\b/i.test(block.raw.trim())) return renderGridBlock(block.raw, pairAttr);
    return `<div class="doc-block visual"${pairAttr}>${escapeHtml(visualLabel(block.raw))}</div>`;
  }
  if (block.type === "table") {
    return `<div class="doc-block table"${pairAttr}>${renderTable(block.raw)}</div>`;
  }
  if (block.type === "list") {
    return `<div class="doc-block list"${pairAttr}>${renderList(block.raw)}</div>`;
  }
  return `<div class="doc-block paragraph"${pairAttr}>${paragraphs(block.raw)}</div>`;
}

function renderImage(raw, pairAttr = "") {
  const match = raw.trim().match(/^!\[([^\]]*)]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/);
  if (!match) return `<div class="doc-block visual"${pairAttr}>Image block</div>`;
  const alt = match[1] || "Document image";
  const src = match[2];
  const title = match[3] || alt;
  return `<figure class="doc-block image"${pairAttr}><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"><figcaption class="caption">${escapeHtml(title)}</figcaption></figure>`;
}

function renderGridBlock(raw, pairAttr = "") {
  const cols = Number(raw.match(/^<grid[^>]*cols="(\d+)"/i)?.[1] ?? 2);
  const columns = [...raw.matchAll(/<column>([\s\S]*?)<\/column>/gi)]
    .map((match) => stripMarkup(match[1]).replace(/\n{2,}/g, "\n").trim())
    .filter(Boolean);
  if (!columns.length) return `<div class="doc-block visual"${pairAttr}>Grid block</div>`;
  const cls = `grid cols-${Math.min(Math.max(cols, 2), 4)}`;
  return `<div class="doc-block ${cls}"${pairAttr}>${columns.map((column) => `<div class="grid-card">${paragraphs(column)}</div>`).join("")}</div>`;
}

function visualLabel(raw) {
  if (/whiteboard/i.test(raw)) return "Whiteboard / diagram block";
  if (/<image\b/i.test(raw)) return "Image block";
  if (/<grid\b/i.test(raw)) return "Grid block";
  return raw.trim().slice(0, 120) || "Visual block";
}

function renderList(raw) {
  const items = raw.split("\n").map((line) => line.trim()).filter(Boolean);
  const ordered = items.every((line) => /^\d+[.)]\s+/.test(line));
  const tag = ordered ? "ol" : "ul";
  const body = items.map((line) => `<li>${escapeHtml(line.replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, ""))}</li>`).join("");
  return `<${tag}>${body}</${tag}>`;
}

function renderTable(raw) {
  if (/<lark-table\b/i.test(raw)) {
    const rows = [...raw.matchAll(/<lark-tr>([\s\S]*?)<\/lark-tr>/gi)]
      .map((row) => [...row[1].matchAll(/<lark-td>([\s\S]*?)<\/lark-td>/gi)]
        .map((cell) => stripMarkup(cell[1]).replace(/\n{2,}/g, "\n").trim()));
    if (rows.length) {
      return `<table>${rows.map((cells, index) => {
        const tag = index === 0 ? "th" : "td";
        return `<tr>${cells.map((cell) => `<${tag}>${escapeHtml(cell)}</${tag}>`).join("")}</tr>`;
      }).join("")}</table>`;
    }
    return `<pre>${escapeHtml(raw)}</pre>`;
  }
  const lines = raw.split("\n").filter((line) => /^\s*\|/.test(line));
  if (lines.length < 2) return `<pre>${escapeHtml(raw)}</pre>`;
  const rows = lines
    .filter((line) => !/^\s*\|?\s*:?-{3,}/.test(line))
    .map((line) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
  return `<table>${rows.map((cells, index) => {
    const tag = index === 0 ? "th" : "td";
    return `<tr>${cells.map((cell) => `<${tag}>${escapeHtml(cell)}</${tag}>`).join("")}</tr>`;
  }).join("")}</table>`;
}

function renderRowsHtml({ leftTitle, rightTitle, leftSource, rightSource, rows, stats }) {
  const renderedRows = rows.map((row, index) => {
    const status = row.kind;
    return `<section class="row ${status}">
  <div class="cell left">${renderDebugBlock(row.left)}</div>
  <div class="gutter"><span>${index + 1}</span><em>${status}${row.score ? ` ${(row.score * 100).toFixed(0)}%` : ""}</em></div>
  <div class="cell right">${renderDebugBlock(row.right)}</div>
</section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aligned Screenshot Compare Debug Rows</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #e5e7eb; color: #111827; font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; }
  .top { position: sticky; top: 0; z-index: 2; background: #0f172a; color: white; padding: 18px 28px; border-bottom: 1px solid #1f2937; }
  .top h1 { margin: 0 0 8px; font-size: 22px; }
  .top p { margin: 0; color: #cbd5e1; font-size: 13px; }
  .titles { display: grid; grid-template-columns: 1fr 96px 1fr; gap: 0; background: #f8fafc; border-bottom: 1px solid #cbd5e1; position: sticky; top: 86px; z-index: 2; }
  .titles div { padding: 14px 24px; font-weight: 700; color: #0f172a; }
  .titles .mid { text-align: center; color: #64748b; }
  .row { display: grid; grid-template-columns: 1fr 96px 1fr; align-items: stretch; border-bottom: 1px solid #d1d5db; }
  .cell { background: white; min-height: 64px; padding: 18px 24px; overflow-wrap: anywhere; }
  .gutter { background: #f1f5f9; color: #64748b; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 11px; text-align: center; }
  .matched .gutter { background: #ecfdf5; color: #047857; }
  .weak .gutter { background: #fff7ed; color: #c2410c; }
  .left-only .left { background: #fff7ed; }
  .right-only .right { background: #eff6ff; }
  .empty { min-height: 42px; color: #94a3b8; font-style: italic; }
  pre { margin: 0; padding: 12px; overflow: auto; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-family: Consolas, monospace; font-size: 12px; line-height: 1.5; white-space: pre-wrap; }
  .block-type { display: inline-block; margin-bottom: 8px; padding: 2px 7px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; }
</style>
</head>
<body>
  <header class="top">
    <h1>Paragraph Alignment Debug Rows</h1>
    <p>${escapeHtml(leftSource)} ↔ ${escapeHtml(rightSource)} | rows ${stats.rows}, matched ${stats.matched}, weak ${stats.weak}, left-only ${stats.leftOnly}, right-only ${stats.rightOnly}</p>
  </header>
  <div class="titles"><div>${escapeHtml(leftTitle)}</div><div class="mid">alignment</div><div>${escapeHtml(rightTitle)}</div></div>
  <main>${renderedRows}</main>
</body>
</html>`;
}

function renderDebugBlock(block) {
  if (!block) return `<div class="empty">No matching block on this side</div>`;
  const label = `<span class="block-type">${escapeHtml(block.type)}</span>`;
  if (block.type === "code" || block.type === "table" || block.type === "visual") return `${label}<pre>${escapeHtml(block.raw)}</pre>`;
  return `${label}${paragraphs(block.raw)}`;
}

function paragraphs(text) {
  return text.split(/\n{2,}/).map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, "<br>")}</p>`).join("");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function screenshotHtml(htmlPath, pngPath, mode) {
  let chromium;
  try {
    const require = createRequire(import.meta.url);
    ({ chromium } = require("playwright"));
  } catch {
    try {
      const require = createRequire(import.meta.url);
      ({ chromium } = require("C:/Users/FW/AppData/Roaming/npm/node_modules/playwright"));
    } catch {
      console.warn("Playwright package not found; wrote HTML only.");
      return null;
    }
  }

  await mkdir(dirname(resolve(pngPath)), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(resolve(htmlPath)).href);
  let alignmentStats = null;
  if (mode === "soft") {
    await page.waitForFunction(() => window.__alignmentDone === true, { timeout: 10000 });
    alignmentStats = await page.evaluate(() => window.__alignmentStats);
  }
  await page.screenshot({ path: pngPath, fullPage: true });
  await browser.close();
  return alignmentStats;
}

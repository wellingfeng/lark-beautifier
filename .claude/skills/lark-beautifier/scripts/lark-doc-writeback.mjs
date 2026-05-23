#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const API = process.env.LARK_OPENAPI_BASE || "https://open.feishu.cn";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const beautifyScript = resolve(scriptDir, "beautify.mjs");

const options = parseArgs(process.argv.slice(2));

if (!options.doc) {
  fail("Usage: node scripts/lark-doc-writeback.mjs --doc <url-or-token> --input <file.md> [--mode safe|structured|bold] [--apply]");
}

if (!options.input) {
  fail("--input is required.");
}

const docToken = extractDocToken(options.doc);
const source = await readFile(resolve(options.input), "utf8");
const preparedMarkdown = await prepareMarkdown(source, options);
const blocks = markdownToFeishuBlocks(preparedMarkdown);
const plan = {
  docToken,
  mode: options.mode,
  dryRun: !options.apply,
  source: resolve(options.input),
  blockCount: blocks.length,
  headings: blocks.filter((block) => block.kind?.startsWith("heading")).map((block) => block._text),
  nativeTables: blocks.filter((block) => block.kind === "larkTable").length,
  callouts: blocks.filter((block) => block.kind === "callout").length,
  whiteboards: blocks.filter((block) => block.kind === "whiteboard").length
};

if (!options.apply) {
  await maybeWriteJson(options.planOutput, { ...plan, blocks });
  console.log(JSON.stringify(plan, null, 2));
  process.exit(0);
}

const token = await resolveToken(options);
if (!token) {
  fail("No OAuth token available. Run lark-mcp login first or pass --token-env NAME with an environment variable.");
}

const existing = await fetchChildren(token, docToken, docToken);
if (options.replace) {
  await deleteAllChildren(token, docToken, docToken, existing.length);
}

const created = await createMarkdownBlocks(token, docToken, docToken, blocks, options.replace ? 0 : existing.length);
const after = await fetchChildren(token, docToken, docToken);

console.log(JSON.stringify({
  ...plan,
  dryRun: false,
  replacedTopLevelBlocks: options.replace ? existing.length : 0,
  createdTopLevelBlocks: created.length,
  afterTopLevelBlocks: after.length
}, null, 2));

function parseArgs(args) {
  const parsed = {
    doc: undefined,
    input: undefined,
    mode: "structured",
    apply: false,
    replace: true,
    tokenEnv: "LARK_USER_ACCESS_TOKEN",
    appId: process.env.LARK_MCP_APP_ID,
    planOutput: undefined,
    beautify: true
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--doc") {
      parsed.doc = args[++index];
    } else if (arg === "--input") {
      parsed.input = args[++index];
    } else if (arg === "--mode") {
      parsed.mode = parseMode(args[++index]);
    } else if (arg === "--apply") {
      parsed.apply = true;
    } else if (arg === "--dry-run") {
      parsed.apply = false;
    } else if (arg === "--append") {
      parsed.replace = false;
    } else if (arg === "--replace") {
      parsed.replace = true;
    } else if (arg === "--token-env") {
      parsed.tokenEnv = args[++index];
    } else if (arg === "--app-id") {
      parsed.appId = args[++index];
    } else if (arg === "--plan-output") {
      parsed.planOutput = args[++index];
    } else if (arg === "--no-beautify") {
      parsed.beautify = false;
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function parseMode(value) {
  if (["safe", "structured", "bold"].includes(value)) return value;
  fail("--mode must be one of: safe, structured, bold");
}

async function prepareMarkdown(source, runOptions) {
  if (!runOptions.beautify) return source;
  const result = spawnSync(process.execPath, [beautifyScript, "--mode", runOptions.mode, runOptions.input], {
    cwd: skillDir,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    fail(result.stderr || `beautify.mjs exited with ${result.status}`);
  }
  return result.stdout;
}

function extractDocToken(value) {
  const match = String(value).match(/\/docx\/([A-Za-z0-9]+)/);
  if (match) return match[1];
  if (/^[A-Za-z0-9]{20,}$/.test(value)) return value;
  fail("Unable to parse Feishu doc token from --doc.");
}

async function resolveToken(runOptions) {
  if (runOptions.tokenEnv && process.env[runOptions.tokenEnv]) {
    return process.env[runOptions.tokenEnv];
  }
  if (!runOptions.appId) return undefined;
  return getLocalMcpToken(runOptions.appId);
}

async function getLocalMcpToken(appId) {
  const larkMcpRoot = process.env.LARK_MCP_ROOT || resolve(process.env.APPDATA || "", "npm", "node_modules", "@larksuiteoapi", "lark-mcp");
  const storeFile = resolve(larkMcpRoot, "dist", "auth", "store.js");
  if (!existsSync(storeFile)) return undefined;
  const { authStore } = await import(pathToFileURL(storeFile).href);
  try {
    return await authStore.getLocalAccessToken(appId);
  } finally {
    authStore.destroy();
  }
}

function markdownToFeishuBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let fence = [];
  let inFence = false;
  let htmlBlock = [];
  let htmlTag = undefined;

  function flushParagraph() {
    const text = paragraph.join("\n").trim();
    paragraph = [];
    if (text) blocks.push(textBlock(text));
  }

  function flushHtml() {
    const raw = htmlBlock.join("\n").trim();
    htmlBlock = [];
    htmlTag = undefined;
    if (!raw) return;
    const parsed = parseKnownHtmlBlock(raw);
    if (parsed) blocks.push(parsed);
    else blocks.push(textBlock(raw));
  }

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      if (!inFence) {
        flushParagraph();
        inFence = true;
        fence = [line];
      } else {
        fence.push(line);
        blocks.push(codeBlock(fence.join("\n")));
        fence = [];
        inFence = false;
      }
      continue;
    }

    if (inFence) {
      fence.push(line);
      continue;
    }

    const startTag = line.trim().match(/^<(callout|lark-table|whiteboard)\b/i);
    if (startTag) {
      flushParagraph();
      htmlTag = startTag[1].toLowerCase();
      htmlBlock = [line];
      if (line.trim().includes(`</${htmlTag}>`)) flushHtml();
      continue;
    }

    if (htmlTag) {
      htmlBlock.push(line);
      if (line.trim().includes(`</${htmlTag}>`)) flushHtml();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      flushParagraph();
      blocks.push(headingBlock(heading[1].length, stripMarkdownInline(heading[2])));
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      blocks.push(bulletBlock(stripMarkdownInline(line.replace(/^\s*[-*]\s+/, ""))));
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      flushParagraph();
      blocks.push(orderedBlock(stripMarkdownInline(line.replace(/^\s*\d+[.)]\s+/, ""))));
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      blocks.push(quoteBlock(stripMarkdownInline(line.replace(/^>\s?/, ""))));
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      flushParagraph();
      blocks.push({ kind: "divider", block_type: 22, divider: {} });
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  if (htmlTag) flushHtml();
  if (fence.length) blocks.push(codeBlock(fence.join("\n")));
  return blocks;
}

function parseKnownHtmlBlock(raw) {
  if (/^<callout\b/i.test(raw)) {
    const body = raw.replace(/^<callout[^>]*>/i, "").replace(/<\/callout>$/i, "").trim();
    return {
      kind: "callout",
      block_type: 19,
      callout: {
        background_color: colorNumber(raw.match(/background-color="([^"]+)"/i)?.[1]),
        border_color: colorNumber(raw.match(/border-color="([^"]+)"/i)?.[1]),
        emoji_id: "memo"
      },
      children: body ? [textBlock(stripMarkdownInline(body))] : []
    };
  }
  if (/^<whiteboard\b/i.test(raw)) {
    return textBlock(stripMarkdownInline(raw), "whiteboard");
  }
  if (/^<lark-table\b/i.test(raw)) {
    const headers = [...raw.matchAll(/<th>([\s\S]*?)<\/th>/gi)].map((match) => decodeHtml(match[1]));
    const rows = [...raw.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)]
      .slice(headers.length ? 1 : 0)
      .map((row) => [...row[1].matchAll(/<td>([\s\S]*?)<\/td>/gi)].map((cell) => decodeHtml(cell[1])));
    if (headers.length) {
      return {
        kind: "larkTable",
        block_type: 31,
        table: {
          property: {
            row_size: Math.max(1, rows.length + 1),
            column_size: headers.length,
            column_width: headers.map((header) => Math.max(120, Math.min(280, header.length * 18 + 80))),
            header_row: true,
            header_column: false
          }
        },
        rows: [headers, ...rows]
      };
    }
  }
  return undefined;
}

function headingBlock(depth, text) {
  const blockType = Math.min(9, Math.max(3, depth + 2));
  const key = `heading${Math.min(9, Math.max(1, depth))}`;
  return richTextBlock(`heading${depth}`, blockType, key, text, { bold: true });
}

function textBlock(text, kind = "text") {
  return richTextBlock(kind, 2, "text", text);
}

function bulletBlock(text) {
  return richTextBlock("bullet", 12, "bullet", text);
}

function orderedBlock(text) {
  return richTextBlock("ordered", 13, "ordered", text);
}

function quoteBlock(text) {
  return richTextBlock("quote", 15, "quote", text);
}

function codeBlock(raw) {
  return textBlock(raw.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, ""), "code");
}

function richTextBlock(kind, blockType, key, content, style = {}) {
  return {
    kind,
    _text: content,
    block_type: blockType,
    [key]: {
      elements: [{
        text_run: {
          content,
          text_element_style: {
            bold: Boolean(style.bold),
            italic: false,
            strikethrough: false,
            underline: false,
            inline_code: kind === "code"
          }
        }
      }],
      style: { align: 1, folded: false }
    }
  };
}

async function createMarkdownBlocks(token, docToken, parentId, parsedBlocks, index) {
  const created = [];
  for (const block of parsedBlocks) {
    const { children, rows, kind, _text, ...payload } = block;
    const result = await api(token, "POST", `/open-apis/docx/v1/documents/${docToken}/blocks/${parentId}/children`, {
      children: [payload],
      index: index + created.length
    }, {
      document_revision_id: -1,
      client_token: `${Date.now()}-${Math.random().toString(16).slice(2)}`
    });
    const createdBlock = result.data.children?.[0];
    if (createdBlock) created.push(createdBlock);
    if (createdBlock?.block_id && Array.isArray(children) && children.length) {
      await createMarkdownBlocks(token, docToken, createdBlock.block_id, children, 0);
    }
    if (createdBlock?.block_id && Array.isArray(rows) && rows.length) {
      await fillTable(token, docToken, createdBlock.block_id, rows);
    }
  }
  return created;
}

async function fillTable(token, docToken, tableBlockId, rows) {
  const cells = await fetchChildren(token, docToken, tableBlockId);
  const requests = [];
  const columnCount = rows[0]?.length || 0;
  for (let row = 0; row < rows.length; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const cell = cells[row * columnCount + column];
      if (!cell?.block_id) continue;
      const children = await fetchChildren(token, docToken, cell.block_id);
      const textChild = children.find((child) => child.block_type === 2) || children[0];
      if (!textChild?.block_id) continue;
      requests.push({
        block_id: textChild.block_id,
        update_text_elements: {
          elements: [{
            text_run: {
              content: rows[row][column] || "",
              text_element_style: {
                bold: row === 0,
                italic: false,
                strikethrough: false,
                underline: false,
                inline_code: false
              }
            }
          }]
        }
      });
    }
  }
  for (let i = 0; i < requests.length; i += 20) {
    await api(token, "PATCH", `/open-apis/docx/v1/documents/${docToken}/blocks/batch_update`, {
      requests: requests.slice(i, i + 20)
    }, {
      document_revision_id: -1,
      client_token: `table-fill-${Date.now()}-${i}`
    });
  }
}

async function fetchChildren(token, docToken, parentId) {
  const items = [];
  let pageToken;
  do {
    const data = await api(token, "GET", `/open-apis/docx/v1/documents/${docToken}/blocks/${parentId}/children`, undefined, {
      page_size: 500,
      ...(pageToken ? { page_token: pageToken } : {})
    });
    items.push(...(data.data.items || []));
    pageToken = data.data.has_more ? data.data.page_token || data.data.next_page_token : undefined;
  } while (pageToken);
  return items;
}

async function deleteAllChildren(token, docToken, parentId, count) {
  if (count <= 0) return;
  await api(token, "DELETE", `/open-apis/docx/v1/documents/${docToken}/blocks/${parentId}/children/batch_delete`, {
    start_index: 0,
    end_index: count
  }, {
    document_revision_id: -1,
    client_token: `delete-${Date.now()}`
  });
}

async function api(token, method, endpoint, data, params = {}) {
  const url = new URL(`${API}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const args = [
    "-sS",
    "--connect-timeout",
    "10",
    "--max-time",
    "90",
    "-H",
    `Authorization: Bearer ${token}`,
    "-H",
    "Content-Type: application/json; charset=utf-8"
  ];
  if (method !== "GET") args.push("-X", method);
  if (data !== undefined) args.push("-d", JSON.stringify(data));
  args.push(url.toString());

  const result = spawnSync(process.platform === "win32" ? "curl.exe" : "curl", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 16
  });
  if (result.status !== 0) {
    fail(result.stderr || `curl exited with ${result.status}`);
  }
  const json = JSON.parse(result.stdout);
  if (json.code !== 0) {
    fail(`Feishu OpenAPI error: ${JSON.stringify(json).slice(0, 1800)}`);
  }
  return json;
}

function stripMarkdownInline(value) {
  return decodeHtml(String(value)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim());
}

function decodeHtml(value) {
  return String(value)
    .replace(/&quot;/g, "\"")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function colorNumber(value) {
  const map = {
    red: 1,
    "light-red": 1,
    orange: 2,
    yellow: 3,
    "light-yellow": 3,
    green: 4,
    "light-green": 4,
    blue: 5,
    "light-blue": 5,
    purple: 6,
    "light-purple": 6
  };
  return map[value] || 2;
}

async function maybeWriteJson(file, data) {
  if (!file) return;
  await writeFile(resolve(file), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function fail(message) {
  console.error(`lark-doc-writeback: ${message}`);
  process.exit(1);
}

# Lark Beautifier

[中文说明](README.zh-CN.md)

Convert ordinary Markdown into Lark-friendly Markdown for Feishu/Lark docs, and guide safe write-back to real Feishu documents through `@larksuiteoapi/lark-mcp` OAuth + Feishu OpenAPI. The tool preserves source meaning while improving document rhythm with Chinese typography, callouts, grids, smart tables, whiteboard hints, and visual suggestions for charts, diagrams, images, and Xiaohongshu-style cards.

## What It Does

- Cleans Chinese typography without touching code, links, image URLs, or raw Lark blocks.
- Converts high-confidence cues into callouts.
- Turns comparison sections into grids.
- Converts complex tables into Lark-friendly table markup.
- Suggests diagrams, charts, whiteboards, images, and Xiaohongshu cards with confirmation gates.
- Provides a dry-run-first Feishu OpenAPI write-back helper for real docs.

## Install As A Codex Skill

Copy the skill folder into your Codex skills directory:

```bash
cp -R skills/lark-beautifier ~/.codex/skills/
```

On Windows PowerShell:

```powershell
Copy-Item -Recurse skills\lark-beautifier $env:USERPROFILE\.codex\skills\
```

Then ask Codex to use `$lark-beautifier`.

You can also install directly from GitHub after cloning:

```bash
git clone https://github.com/wellingfeng/lark-beautifier.git
cp -R lark-beautifier/skills/lark-beautifier ~/.codex/skills/
```

## Install As A Claude Code Skill

Claude Code skills use the same `SKILL.md` entrypoint. This repository includes a Claude Code project-skill copy at:

```text
.claude/skills/lark-beautifier
```

For a project-local Claude Code install, copy it into your project:

```bash
mkdir -p .claude/skills
cp -R lark-beautifier/.claude/skills/lark-beautifier .claude/skills/
```

For a personal Claude Code install:

```bash
mkdir -p ~/.claude/skills
cp -R lark-beautifier/.claude/skills/lark-beautifier ~/.claude/skills/
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force .claude\skills
Copy-Item -Recurse lark-beautifier\.claude\skills\lark-beautifier .claude\skills\
```

## Install

```bash
npm install
npm run build
```

## CLI

```bash
npm run dev -- examples/raw.md -o examples/beautified.md --mode structured
```

After building:

```bash
node dist/cli.js input.md --output output.md
```

Modes:

| Mode | Purpose |
|---|---|
| `safe` | Conservative formatting for high-stakes documents |
| `structured` | Default Feishu readability improvement |
| `bold` | User-approved draft with visual artifact suggestions |

Useful options:

```bash
node dist/cli.js input.md \
  --output output.md \
  --mode structured \
  --callouts auto \
  --grids auto \
  --tables smart \
  --whiteboards suggest \
  --enhancements suggest
```

Use `--check` to fail when a file would change, `--diff` to print a unified diff, and `--to-lark-cli` to print a legacy `lark-cli docs +create --markdown` command for the generated output file.

`--enhancements suggest` only adds recommendation callouts. Use `--enhancements draft` to include Mermaid or prompt drafts for review; get user confirmation before inserting real images, charts, whiteboards, or major restructures into a live Lark doc.

## Feishu Write-Back

The skill includes a dry-run-first write-back helper:

```bash
node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input examples/beautified.md \
  --mode structured \
  --plan-output plan.json
```

After reviewing the plan and authorizing with `lark-mcp`, add `--apply`:

```bash
LARK_MCP_APP_ID=<app_id> node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input examples/beautified.md \
  --mode structured \
  --apply
```

The helper never needs app secrets on the command line when a local `lark-mcp` OAuth token already exists.

For first-time OAuth login, use:

```bash
npx -y @larksuiteoapi/lark-mcp login -a <app_id> -s <app_secret> -p 8765 --host 127.0.0.1
```

Do not commit app secrets, user access tokens, refresh tokens, or local OAuth storage.

## Skill Layout

The installable Codex skill lives at:

```text
skills/lark-beautifier
```

The Claude Code skill lives at:

```text
.claude/skills/lark-beautifier
```

Install it by copying that folder into your Codex skills directory, for example:

```bash
cp -R skills/lark-beautifier ~/.codex/skills/
```

The skill delegates deterministic formatting to the repository CLI when available, falls back to its bundled script when installed standalone, and prefers `@larksuiteoapi/lark-mcp` OAuth authorization-code login plus Feishu OpenAPI when creating or updating real Lark docs.

## Development

```bash
npm test
npm run check
npm run build
npm run lint:md
npm run check:skills
node skills/lark-beautifier/scripts/self-check.mjs
```

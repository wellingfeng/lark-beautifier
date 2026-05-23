# Lark Beautifier

[中文说明](README.zh-CN.md)

Lark Beautifier is a Node.js / TypeScript CLI and installable agent skill for turning plain Markdown into Feishu/Lark-ready documents. It keeps the source meaning intact while adding safer structure, stronger visual rhythm, Lark-flavored Markdown components, and optional Feishu write-back helpers.

The current v3 direction is visual-first: the formatter still handles typography, callouts, grids, and smart tables, but the skill can also orchestrate cover blocks, section dividers, timelines, action items, Feishu whiteboards, flowcharts, diagrams, generated images, infographics, and Xiaohongshu-style demo cards when the user asks for a richer document.

## Features

- Cleans Chinese typography without touching fenced code, inline code, links, image URLs, raw HTML, or existing Lark XML blocks.
- Converts high-confidence cues into Feishu-style callouts and comparison grids.
- Renders complex Markdown tables as smarter Lark-friendly tables with semantic column widths.
- Separates risk mode from visual style: `safe | structured | bold` controls safety, while `theme` and `visualDensity` control presentation.
- Adds reusable components such as `cover-banner`, `section-divider`, `timeline`, `before-after`, `quote-block`, `kpi-card-row`, and `action-items`.
- Produces visual suggestions or drafts for whiteboards, Mermaid diagrams, image prompts, charts, and social cards.
- Includes a dry-run-first Feishu write-back helper for real docs through Feishu OpenAPI and `@larksuiteoapi/lark-mcp` OAuth.

## Install

```bash
npm install
npm run build
```

Run from source:

```bash
npm run dev -- examples/raw.md -o examples/beautified.md --mode structured
```

Run after build:

```bash
node dist/cli.js input.md --output output.md --mode structured
```

## CLI Usage

```bash
node dist/cli.js input.md \
  --output output.md \
  --mode structured \
  --theme technical-blue \
  --visual-density rich \
  --components auto \
  --callouts auto \
  --grids auto \
  --tables smart \
  --whiteboards suggest \
  --enhancements suggest
```

Risk modes:

| Mode | Purpose |
| --- | --- |
| `safe` | Conservative formatting for high-stakes documents. |
| `structured` | Default mode for PRDs, meeting notes, technical plans, reports, retros, and project docs. |
| `bold` | Stronger visual draft mode for user-approved rich documents. |

Visual themes:

| Theme | Best For |
| --- | --- |
| `technical-blue` | Engineering docs, architecture notes, API docs, release notes. |
| `warm-product` | PRDs, product plans, user stories, launch docs. |
| `clean-minimal` | Executive briefs, external docs, compliance-sensitive writing. |
| `vivid-marketing` | Marketing drafts, social posts, event pages, demo scripts. |

Component controls:

```bash
# Let the analyzer choose high-confidence components.
node dist/cli.js input.md -o output.md --components auto --theme auto

# Opt into specific components only.
node dist/cli.js input.md -o output.md --components cover-banner,section-divider,action-items

# Inspect document signals as JSON.
node dist/cli.js input.md --analyze --check 2> analysis.json
```

Useful validation flags:

- `--check` exits non-zero if the file would change.
- `--diff` prints a unified diff.
- `--conservative` downgrades risky transformations.
- `--to-lark-cli` prints a legacy `lark-cli docs +create` command for the generated output file.

## Install As A Skill

The canonical skill package lives at:

```text
skills/lark-beautifier
```

Install it for Codex:

```bash
git clone https://github.com/wellingfeng/lark-beautifier.git
cp -R lark-beautifier/skills/lark-beautifier ~/.codex/skills/
```

Windows PowerShell:

```powershell
git clone https://github.com/wellingfeng/lark-beautifier.git
Copy-Item -Recurse lark-beautifier\skills\lark-beautifier $env:USERPROFILE\.codex\skills\
```

Then ask Codex to use `$lark-beautifier`.

The Claude Code mirror is kept in lockstep at:

```text
.claude/skills/lark-beautifier
```

Project-local Claude Code install:

```bash
mkdir -p .claude/skills
cp -R lark-beautifier/.claude/skills/lark-beautifier .claude/skills/
```

## Feishu Write-Back

The write-back helper is dry-run-first. It can produce a plan from a local Markdown file without modifying the target document:

```bash
node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input examples/beautified.md \
  --mode structured \
  --plan-output tmp/writeback-plan.json
```

After reviewing the plan, apply it explicitly:

```bash
LARK_MCP_APP_ID=<app_id> node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input examples/beautified.md \
  --mode structured \
  --apply
```

For `--mode bold`, live write-back also requires `--confirm-bold`.

For first-time OAuth login, prefer the Lark MCP authorization-code flow:

```bash
npx -y @larksuiteoapi/lark-mcp login -a <app_id> -s <app_secret> -p 8765 --host 127.0.0.1
```

Do not commit app secrets, access tokens, refresh tokens, or local OAuth storage.

## Development

```bash
npm test
npm run check
npm run build
npm run lint:md
npm run check:skills
node skills/lark-beautifier/scripts/self-check.mjs
npm run package:skill
```

The canonical skill source is `skills/lark-beautifier`. After changing it, run:

```bash
npm run sync:skills
npm run check:skills
```

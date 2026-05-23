---
name: lark-beautifier
description: Beautify Feishu/Lark documents and Markdown with deterministic formatting, Chinese typography cleanup, callouts, comparison grids, smart Lark tables, whiteboard hints, and optional visual enhancement proposals for diagrams, charts, images, and Xiaohongshu-style cards. Use when a user wants to beautify an existing Lark/Feishu doc, says a Lark document looks plain, asks to optimize readability, wants visual polish with images/charts/flowcharts/baoyu-xhs-images, needs a PRD, meeting note, technical plan, weekly report, retro, project plan, or API doc prepared for Lark, provides Markdown and asks for a Lark doc, or wants safe OpenAPI write-back through `@larksuiteoapi/lark-mcp` OAuth authorization-code login.
---

# Lark Beautifier

## Core Workflow

1. Identify the input: Markdown file/text, Feishu doc URL, or a requested document type.
2. Choose the least risky mode:
   - `safe`: high-stakes polish; conservative typography and callouts.
   - `structured`: normal Feishu readability improvement; tables, grids, and suggestions.
   - `bold`: user-approved test or optimization draft; visual artifact drafts.
3. Read `references/document-profiles.md` when the document type should affect structure.
4. Run the deterministic formatter before manual rewriting:

   ```bash
   node skills/lark-beautifier/scripts/beautify.mjs input.md --output output.md --mode structured
   ```

5. Preserve source facts. Do not add claims, remove caveats, or rewrite decisions unless the user explicitly requests content editing.
6. Ask before executing bold treatments: generated/fetched images, real charts, Mermaid blocks, Lark whiteboards, `baoyu-xhs-images`, major section moves, inferred data, or new sections.

## Markdown Beautification

Use `references/cli-and-modes.md` for CLI flags and mode behavior.

Allowed without extra confirmation:

- Chinese typography cleanup;
- high-confidence cue callouts;
- obvious comparison grids;
- complex table formatting;
- visual suggestion callouts.

Never modify fenced code, inline code, links, image URLs, existing HTML, or existing Lark XML blocks.

## Feishu Write-Back

Use `references/lark-mcp-oauth.md` and `references/writeback-workflow.md` before reading or writing real Feishu documents.

Default to dry-run:

```bash
node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --mode structured \
  --plan-output plan.json
```

Only write after the user confirms the dry-run plan:

```bash
node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --mode structured \
  --apply
```

Prefer `@larksuiteoapi/lark-mcp` OAuth authorization-code login. Do not use `lark-cli auth login` device flow unless the user explicitly asks for it. Never print tokens or app secrets.

## Visual Handoff

Read `references/visual-enhancement-patterns.md` before adding images, diagrams, charts, social cards, or major layout changes.

Use the narrowest suitable tool:

- Mermaid for simple flows, timelines, and chart drafts.
- `lark-whiteboard-cli` / `lark-whiteboard` for real Feishu whiteboards.
- `baoyu-xhs-images` style workflows for Xiaohongshu cards.
- `imagegen` for generated bitmap covers or illustrations.

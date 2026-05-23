---
name: lark-beautifier
description: Beautify Feishu/Lark documents and Markdown with deterministic formatting, Chinese typography cleanup, callouts, comparison grids, smart Lark tables, whiteboard hints, and optional visual enhancement proposals for diagrams, charts, images, and Xiaohongshu-style cards. Use when a user wants to beautify an existing Lark/Feishu doc, says a Lark document looks plain, asks to optimize readability, wants visual polish with images/charts/flowcharts/baoyu-xhs-images, needs a PRD, meeting note, technical plan, weekly report, retro, project plan, or API doc prepared for Lark, provides Markdown and asks for a Lark doc, or wants safe OpenAPI write-back through `@larksuiteoapi/lark-mcp` OAuth authorization-code login.
---

# Lark Beautifier

## Workflow

1. Inspect the source Markdown or Lark document and identify whether it is a PRD, meeting note, technical plan, weekly report, retro, project plan, API doc, campaign note, or social-content draft. Read `references/document-profiles.md` when the document type should affect structure.
2. Pick the least risky mode that satisfies the request:
   - `safe`: high-stakes polish with conservative typography and callouts.
   - `structured`: normal Feishu readability improvement with tables, grids, and suggestions.
   - `bold`: user-approved test/optimization drafts with visual artifact drafts.
3. Prefer the deterministic CLI over manual rewriting:

   ```bash
   node skills/lark-beautifier/scripts/beautify.mjs input.md --output output.md --mode structured
   ```

4. Use safe mode for high-stakes or executive documents:

   ```bash
   node skills/lark-beautifier/scripts/beautify.mjs input.md --output output.md --mode safe
   ```

5. For stronger readability work, use bold mode only when the user asked for a bold test or approved the visual plan:

   ```bash
   node skills/lark-beautifier/scripts/beautify.mjs input.md --output output.md --mode bold
   ```

6. Before bold changes, ask the user to confirm the specific visual upgrades. Bold changes include generated/fetched images, real charts, Mermaid blocks, Lark whiteboards, `baoyu-xhs-images`, major section moves, and new sections not present in the source.
7. If the user wants to create or update a Lark doc, generate or plan the content first, then prefer `@larksuiteoapi/lark-mcp` OAuth authorization-code login and direct Feishu OpenAPI write-back. Do not use `lark-cli auth login` device flow unless the user explicitly asks for it.
8. If the output includes a whiteboard suggestion and the user wants a real diagram, use `lark-whiteboard-cli` or the `lark-whiteboard` skill after the Markdown is created.

## CLI Options

Use these options when the user needs control:

```bash
node skills/lark-beautifier/scripts/beautify.mjs input.md \
  --output output.md \
  --mode structured \
  --callouts auto \
  --grids auto \
  --tables smart \
  --whiteboards suggest \
  --enhancements suggest
```

- `--mode safe|structured|bold`: Select a preset. Explicit lower-level flags override the preset.
- `--callouts off|auto|conservative`: Convert cue paragraphs for tips, risks, conclusions, and recommendations.
- `--grids off|auto|conservative`: Convert short paired sections such as option A versus option B or pros versus cons.
- `--tables markdown|smart|lark`: Keep simple tables as Markdown; convert complex tables in `smart`.
- `--whiteboards off|suggest|insert-blank`: Suggest a whiteboard by default; insert blank whiteboard markup only when requested.
- `--enhancements off|suggest|draft`: `suggest` adds visual recommendation callouts; `draft` also includes Mermaid/prompt drafts for review. Do not use `draft` to write back to a user document unless the user confirmed bold visual changes.
- `--check`: Report whether output would change without writing.
- `--diff`: Show a unified diff when the full repository CLI is available.
- `--to-lark-cli`: Print a legacy `lark-cli docs +create --markdown` command for the output path. Prefer `lark-mcp` OAuth + OpenAPI for real document updates.

## Editing Rules

- Preserve source facts and meaning. Do not add claims, remove caveats, or rewrite decisions.
- Do not modify fenced code, inline code, links, image URLs, existing HTML, or existing Lark XML blocks.
- Keep simple Markdown readable; use Lark blocks only when they improve scanning.
- Keep `<grid>`, `<column>`, `<callout>`, `<lark-table>`, and `<whiteboard>` blocks as raw XML or HTML. Do not pass them through a generic formatter that may escape tags.
- Read `references/lark-flavored-markdown.md` when manually checking or extending block syntax.
- Read `references/visual-enhancement-patterns.md` before adding images, diagrams, charts, social cards, or major layout changes.

## Visual Enhancements

Use a two-pass approach:

1. First pass: run safe formatting and optional `--enhancements suggest`.
2. Review the inserted suggestions and decide which visual treatments are actually useful.
3. Ask the user before executing any bold treatment.
4. After confirmation, create the requested visual artifact with the narrowest suitable tool:
   - Mermaid for simple flows, timelines, and charts that can remain Markdown.
   - `lark-whiteboard-cli` / `lark-whiteboard` for real Feishu whiteboards.
   - `baoyu-xhs-images` style workflows for Xiaohongshu image cards.
   - `imagegen` for generated bitmap cover images or illustrations.

Allowed without confirmation: typography cleanup, cue callouts, obvious two-column grids, complex table formatting, and visual suggestion callouts.

Requires confirmation: generated or fetched images, actual charts/diagrams/whiteboards, `baoyu-xhs-images`, inferred data, new claims, large section moves, and publishing back to an existing doc.

## Handoff To Lark

When the user wants a real Lark document:

1. Run the beautifier and inspect the generated Markdown.
2. Read `references/lark-mcp-oauth.md` before authenticating or writing back.
3. Run `scripts/lark-doc-writeback.mjs` without `--apply` to inspect the block plan before replacing or appending to a real doc.
4. Use `@larksuiteoapi/lark-mcp` OAuth authorization-code login on localhost. If the browser asks for permission, let the user confirm it.
5. Use Feishu OpenAPI to read/update the doc. Keep tokens local, never print tokens or app secrets, and prefer environment variables or local secure storage over hardcoded credentials.
6. If the document contains architecture, process, timeline, org, dependency, or cause-analysis sections, resolve whiteboard suggestions after the doc exists.

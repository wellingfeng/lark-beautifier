
# Claude Code Guidance

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Before making changes, also read and follow `RTK.md` for the project's general AI coding rules.

## Project

`lark-beautifier` is a Node/TypeScript CLI + library that converts ordinary Markdown into Lark/Feishu-friendly Markdown (Chinese typography, callouts, comparison grids, smart tables, whiteboard/visual hints) and ships a dry-run-first OpenAPI write-back helper that pushes the result back into real Feishu docs via `@larksuiteoapi/lark-mcp` OAuth. The same logic is also distributed as a Codex/Claude Code skill (see "Skills" below).

Runtime: Node `>=20`, ESM (`"type": "module"`). Source is TypeScript, emitted to `dist/`.

## Commands

Build / typecheck / run:

```bash
npm install
npm run build           # tsc -p tsconfig.json -> dist/
npm run check           # tsc --noEmit
npm run dev -- examples/raw.md -o examples/beautified.md --mode structured
node dist/cli.js input.md --output output.md   # after build
```

Tests (Vitest):

```bash
npm test                                  # all
npx vitest run tests/callouts.test.ts     # single file
npx vitest run -t "<test name>"           # single test by name
```

Lint / docs / skill sync:

```bash
npm run lint:md         # markdownlint-cli2 over **/*.md (excluding node_modules, tmp, dist)
npm run check:skills    # diff skills/lark-beautifier against .claude/skills/lark-beautifier
npm run sync:skills     # copy skills/ -> .claude/skills/ (overwrites target)
npm run package:skill   # sync + check + package via tools/package-skill.mjs
node skills/lark-beautifier/scripts/self-check.mjs   # standalone skill self-check
```

CLI mode flags (see `src/config.ts` for the matrix):

- `--mode safe|structured|bold` chooses the risk floor. `safe` forces conservative typography and disables grids/whiteboards/enhancements; `structured` (default) enables auto callouts/grids, smart tables, and suggestion-only enhancements; `bold` upgrades tables to `lark` and enhancements to `draft` (Mermaid/prompt drafts inline).
- `--conservative` downgrades `auto` -> `conservative` and `draft` -> `suggest` even inside the chosen mode.
- `--check` exits non-zero if the file would change (useful in CI); `--diff` prints a unified diff.

## Architecture

### Beautification pipeline (`src/`)

`beautifyMarkdown()` in `src/index.ts` is the single entry point. It runs a fixed, deterministic pipeline against a remark MDAST:

1. `parser.ts` — `unified().use(remarkParse).use(remarkGfm)` -> MDAST.
2. `transforms/headings.ts` — heading normalization.
3. `transforms/typography.ts` — Chinese typography cleanup (skips fenced/inline code, links, image URLs, HTML, existing Lark XML).
4. `transforms/callouts.ts` — cue-phrase callouts (gated by `callouts: off|auto|conservative`).
5. `transforms/grids.ts` — comparison grids (gated by `grids`).
6. `transforms/tables.ts` — table rendering (gated by `tables: markdown|smart|lark`).
7. `transforms/whiteboards.ts` — whiteboard hints (gated by `whiteboards: off|suggest|insert-blank`).
8. `transforms/enhancements.ts` — image/chart/Mermaid/Xiaohongshu enhancement proposals (gated by `enhancements: off|suggest|draft`).
9. `renderer/lark.ts` — serialises MDAST back to Lark-flavored Markdown.

Mode -> per-toggle defaults live in `modeDefaults` in `src/config.ts`. `normalizeConfig` layers `defaultConfig` < mode defaults < explicit options, then applies `conservative`. Adding a new transform: add it to the pipeline in `src/index.ts`, give it a toggle in `BeautifierConfig`, and extend `modeDefaults` so each mode picks a sensible default. Each transform must be a no-op when its toggle is `off`.

Invariant enforced across all transforms: never modify fenced code, inline code, link/image URLs, raw HTML, or existing Lark XML blocks. Tests in `tests/` lock this down per-feature plus snapshots and a writeback-plan test.

### Skills (dual copy: Codex + Claude Code)

Two identical-by-content skill packages live in-repo and are kept in lockstep by `tools/sync-skills.mjs` + `tools/check-skill-sync.mjs`:

- `skills/lark-beautifier/` — Codex skill (canonical source).
- `.claude/skills/lark-beautifier/` — Claude Code skill (mirror target).

The check script (`tools/check-skill-sync.mjs`) treats `skills/lark-beautifier` as source and fails if `.claude/skills/lark-beautifier` differs. Edit the Codex copy and run `npm run sync:skills` (or `npm run package:skill`) — do not hand-edit `.claude/skills/` independently or `check:skills` will fail.

Each skill bundles its own `scripts/beautify.mjs` (standalone fallback that mirrors the CLI) and `scripts/lark-doc-writeback.mjs` (the dry-run-first OpenAPI helper), so the skill works when installed without this repo. The skill prefers the repo CLI when present and falls back to the bundled script otherwise.

### Feishu write-back

`scripts/lark-doc-writeback.mjs` (and the in-skill copies) is the production write-back path. Contract:

- Default is dry-run: it produces a `plan.json` describing the proposed changes against the real Feishu doc. `--apply` is required to actually mutate the doc.
- `--mode bold` requires `--confirm-bold` in addition to `--apply`.
- Auth: prefers `@larksuiteoapi/lark-mcp` OAuth authorization-code login (token is taken from local lark-mcp storage; only `LARK_MCP_APP_ID` env var is needed). Do not fall back to `lark-cli auth login` device flow unless the user asks for it.
- Never log/print tokens, app secrets, refresh tokens, or paths into local OAuth storage. `.env.example` is the committed template; real `.env` files are gitignored.

`tests/writeback-plan.test.ts` covers plan generation; treat it as the contract guard for write-back changes.

## File layout conventions

Keep the repo root limited to committed project files (source, configs, packaging, top-level docs like `README*.md` / `LICENSE` / `CONTRIBUTING.md` / `CLAUDE.md` / `AGENTS.md` / `DEVELOPMENT_PLAN.md`). For everything else:

- `tmp/` — all ephemeral working files. Screenshots, ad-hoc scripts (e.g. one-off `.py`/`.cjs` probes), generated plan JSON (`*-plan.json`, `writeback-plan*.json`), beautified drafts (`*-doc.md`, `*-pretty.md`, `*-plain.md`), QR images, debug logs, and any scratch config a session produces. `tmp/` is already gitignored.
- `doc/` — long-form documentation that should be tracked in git (design notes, reference write-ups, architectural docs). Anything that is a "document" rather than user-facing README/Contributing/License goes here.
- Never drop new screenshots, plan JSONs, ad-hoc scripts, or draft Markdown at the repo root. Write them straight to `tmp/`. If a file outgrows `tmp/` and needs to be tracked, move it to `doc/` (docs) or the appropriate source directory (`src/`, `tools/`, `skills/`, `tests/`) — not back to root.
- Existing committed root-level utilities stay where they are: real scripts under `tools/` and `skills/lark-beautifier/scripts/`; test fixtures under `tests/fixtures/`; examples under `examples/`.

## Conventions to preserve

- TypeScript ESM with NodeNext resolution. Internal imports use the `.js` extension on TS source (e.g. `from "./config.js"`) — this is required for emitted ESM to resolve, do not strip it.
- Source preservation: beautification must not invent claims, drop caveats, reorder sections, or rewrite decisions. Visual enhancements beyond `suggest` (real images, real charts, whiteboards, Xiaohongshu cards, major restructures) are gated behind explicit user confirmation in the skill workflow.
- When changing the pipeline or skill scripts, run `npm test && npm run check && npm run lint:md && npm run check:skills` before declaring done.

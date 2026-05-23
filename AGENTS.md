# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code, etc.) working in this repository. For full project architecture and commands, read `CLAUDE.md` — this file only adds the file-layout discipline that every agent must follow.

## File layout conventions

Keep the repo root limited to committed project files (source, configs, packaging, top-level docs like `README*.md` / `LICENSE` / `CONTRIBUTING.md` / `CLAUDE.md` / `AGENTS.md` / `DEVELOPMENT_PLAN.md`). For everything else:

- `tmp/` — all ephemeral working files. Put here:
  - Screenshots and image debug output (`*.png`, `*.jpg`).
  - Ad-hoc scripts and one-off probes (`*.py`, `*.cjs`, `*.mjs`, `*.sh` that are not part of the published tool surface).
  - Generated plans, dumps, and configs (`*-plan.json`, `writeback-plan*.json`, `*_children.json`, `*_probe.json`, scratch `.env`/`.json`/`.txt` snapshots).
  - Beautified drafts and intermediate Markdown (`*-doc.md`, `*-pretty.md`, `*-plain.md`, `*-final.md`).
  - QR codes, OAuth/login debug artifacts.

  `tmp/` is already in `.gitignore` — files here will not be committed by accident.

- `doc/` — long-form documentation that should be tracked in git (design notes, reference write-ups, architectural docs). Anything that is a "document" rather than user-facing `README*` / `CONTRIBUTING` / `LICENSE` goes here, not at root.

- **Never** drop new screenshots, plan JSONs, ad-hoc scripts, or draft Markdown at the repo root. Write them straight to `tmp/`. If a file outgrows `tmp/` and needs to be tracked, move it to `doc/` (docs) or the appropriate source directory (`src/`, `tools/`, `skills/`, `tests/`) — not back to root.

- Existing committed root-level utilities stay where they are: real scripts live under `tools/` and `skills/lark-beautifier/scripts/`; test fixtures under `tests/fixtures/`; example inputs under `examples/`.

## Output path rules of thumb

- Beautifier CLI / write-back dry-runs: write outputs under `tmp/`, e.g. `--output tmp/<name>-pretty.md` and `--plan-output tmp/<name>-plan.json`.
- Screenshots from manual verification or browser sessions: save into `tmp/` with a descriptive prefix (`tmp/screenshot-*.png`, `tmp/qr-*.png`, `tmp/debug-*.png`).
- One-off probe scripts: place under `tmp/` (e.g. `tmp/stitch.py`). Promote to `tools/` or `scripts/` only after the user asks to keep it.
- Long-form docs intended for the team: create them under `doc/` from the start.

# CLI And Modes

Use this reference when a user needs precise CLI behavior.

## Modes

| Mode | Behavior |
|---|---|
| `safe` | Conservative callouts, no grids, Markdown tables, no whiteboard or visual suggestions |
| `structured` | Callouts, grids, smart Lark tables, whiteboard suggestions, visual suggestions |
| `bold` | Aggressive Lark tables and draft Mermaid/prompt artifacts for user-approved optimization |

Explicit lower-level flags override the selected mode.

## Beautify Markdown

```bash
node skills/lark-beautifier/scripts/beautify.mjs input.md \
  --output output.md \
  --mode structured \
  --callouts auto \
  --grids auto \
  --tables smart \
  --whiteboards suggest \
  --enhancements suggest \
  --theme auto \
  --components off \
  --visual-density balanced
```

## Options

- `--mode safe|structured|bold`: Select a preset.
- `--callouts off|auto|conservative`: Convert cue paragraphs for tips, risks, conclusions, and recommendations.
- `--grids off|auto|conservative`: Convert short paired sections such as option A versus option B or pros versus cons.
- `--tables markdown|smart|lark`: Keep simple tables as Markdown; convert complex tables in `smart`.
- `--whiteboards off|suggest|insert-blank`: Suggest a whiteboard by default; insert blank whiteboard markup only when requested.
- `--enhancements off|suggest|draft`: Add visual recommendation callouts; `draft` also includes Mermaid/prompt drafts.
- `--theme auto|technical-blue|warm-product|clean-minimal|vivid-marketing`: Select the palette and emoji vocabulary. `auto` falls back to `technical-blue` unless the analyzer sees a clear theme signal.
- `--components off|auto|cover-banner,...`: Inject component blocks from high-confidence content signals. Supported names: `cover-banner`, `section-divider`, `action-items`, `kpi-card-row`, `timeline`, `before-after`, `quote-block`.
- `--visual-density minimal|balanced|rich`: Control component intensity. `minimal` avoids section dividers and secondary components, `balanced` enables normal auto components, `rich` also allows quote-blocks and section summaries.
- `--check`: Report whether output would change without writing.
- `--diff`: Show a unified diff when the full repository CLI is available.
- `--to-lark-cli`: Print a legacy `lark-cli docs +create --markdown` command for the output path.

## Safety Rules

- Use `safe` for executive, legal, finance, compliance, or other high-stakes documents.
- Use `structured` as the default for normal team documents.
- Use `bold` only when the user asks for a bold rewrite/test or approves the visual plan.
- Do not write `bold` output back to a live Feishu document without explicit confirmation.

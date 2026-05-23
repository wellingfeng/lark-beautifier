---
name: lark-beautifier
description: Visual-first Feishu/Lark document beautification for Markdown and existing docs: deterministic formatting, Chinese typography cleanup, theme palettes, reusable Lark components, smart tables, and proactive visual artifact orchestration with Lark whiteboards, flowcharts, timelines, images, infographics, and Xiaohongshu-style demo cards. Use when a user wants to beautify or redesign a Lark/Feishu doc, says it looks plain, asks for stronger visual polish, wants diagrams/images/timelines/social cards, needs a PRD, meeting note, technical plan, weekly report, retro, project plan, API doc, marketing draft, or Xiaohongshu-style presentation prepared for Lark, provides Markdown and asks for a Lark doc, or wants safe OpenAPI write-back through `@larksuiteoapi/lark-mcp` OAuth authorization-code login.
---

# Lark Beautifier

## Core Workflow

1. **Identify input**: Markdown file/text, Feishu doc URL, or a requested document type.
2. **Pick a mode** (risk floor):
   - `safe`: high-stakes polish; conservative typography and callouts only.
   - `structured`: normal Feishu readability improvement; tables, grids, suggestions.
   - `bold`: user-approved strong visual draft; real diagrams, timelines, image/card drafts.
3. **Pick a theme** (visual layer) — see `references/themes-and-components.md`:
   - `technical-blue` (default for engineering docs, release notes)
   - `warm-product` (PRDs, user stories, product launches)
   - `clean-minimal` (executive briefings, compliance, external)
   - `vivid-marketing` (marketing copy, event announcements, social drafts)
4. **Pick components** by content signals (see decision table in `themes-and-components.md`):
   cover-banner, kpi-card-row, section-divider, before-after, timeline, quote-block, action-items.
5. **Read `references/document-profiles.md`** when the document type should affect structure.
6. **Run the deterministic formatter** before manual rewriting. For ordinary "美化/优化排版/更好看",
   default to rich visual output:

   ```bash
   node skills/lark-beautifier/scripts/beautify.mjs input.md \
     --output output.md \
     --mode structured \
     --theme auto \
     --components auto \
     --visual-density rich \
     --whiteboards suggest \
     --enhancements draft
   ```

7. **Preserve source facts**. Do not add claims, remove caveats, or rewrite decisions unless the user explicitly requests content editing.
8. **Prefer real visual artifacts over suggestion-only callouts** when the user explicitly asks for a visual version, diagrams, timelines, images, cards, or a new Lark document. Treat that as permission for that visual class, but never invent facts, metrics, quotes, relationships, or sources.

## Visual-First Default

When the user asks for "美化", "视觉优化", "更高级", "强视觉版", or asks to create a new polished Feishu document, do not stop at text cleanup:

1. Produce a Lark-ready document skeleton with cover, KPI/summary cards, section rhythm, and action items when signals exist.
2. Add at least one real visual artifact when the document has suitable structure:
   - process / workflow / state changes -> flowchart or swimlane whiteboard;
   - architecture / modules / dependencies -> architecture whiteboard;
   - roadmap / release history / evolution -> timeline or milestone whiteboard;
   - comparison / before-after / selection -> comparison component or whiteboard;
   - marketing / social / case story -> Xiaohongshu-style demo card or image prompt.
3. Use suggestion callouts only when the user has not authorized visual generation, the target doc is high-stakes, or required data is missing.
4. If the user explicitly says "画流程图", "加图片", "做时间线", "做小红书图", "强视觉版", or asks for a new visual document, execute the relevant handoff without asking again for that category. Ask only for missing brand style, missing data, overwrite risk, or irreversible write-back decisions.
5. For a newly created Lark doc, a blank `<whiteboard type="blank"></whiteboard>` is incomplete. Immediately fill each returned board token through `lark-whiteboard` / `lark-whiteboard-cli`.

## Markdown Beautification

Use `references/cli-and-modes.md` for CLI flags and mode behavior.
Use `references/themes-and-components.md` for theme/component selection.

### Auto-analyze mode

The TS CLI can scan the document, recommend a theme, and auto-inject high-confidence components without manual rewriting:

```bash
# Inspect what the analyzer sees (writes JSON SignalReport to stderr):
node scripts/beautify.mjs input.md --analyze 2>analysis.json

# Apply theme + component auto-injection:
node scripts/beautify.mjs input.md --output out.md --mode structured --components auto --theme auto
```

- `--theme auto` (default) scores keyword vocabulary across the 4 themes; needs score ≥ 3 to override the `technical-blue` fallback.
- `--components off` (default) is a no-op. `--components auto` enables cover-banner, action-items, and density-appropriate section-divider, kpi-card-row, timeline, before-after, and quote-block transforms. `--components cover-banner,action-items` partially opts in.
- `--visual-density minimal|balanced|rich` controls visual rhythm. `minimal` keeps only the safest top/bottom components, `balanced` is the default, and `rich` also allows quote-blocks and section summaries.
- `--analyze` always runs the analyzer; combine with `--check` to inspect without writing.
- The analyzer still writes all detected component signals to SignalReport JSON; if a signal is not auto-applied, it may still appear as an enhancement suggestion.

Allowed without extra confirmation:

- Chinese typography cleanup;
- high-confidence cue callouts;
- obvious comparison grids;
- complex table formatting;
- visual suggestion callouts;
- applying theme palette (callout colors per theme rules);
- applying component templates when content signals match (see decision table);
- drafting local Mermaid, whiteboard DSL, image prompts, and Xiaohongshu-card prompts under `tmp/`;
- creating real diagrams/images/cards for new visual documents when the user requested that visual class.

Never modify fenced code, inline code, links, image URLs, existing HTML, or existing Lark XML blocks.

## Visual Vocabulary (v2)

When the user asks "make this more visual" / "美化" / "优化下排版", default to:

1. Insert a **cover-banner** at top (image optional but recommended).
2. Insert a **kpi-card-row** if the doc has 3-4 parallel numbers/dates/versions.
3. Add a real **timeline / milestone visual** when the content has chronology, release history, or roadmap signals.
4. Add a real **flowchart / architecture whiteboard** when the content has process, dependency, or system structure signals.
5. Add **section-divider** before each H2 (emoji + 1-line chapter summary).
6. Use **before-after** for any "old vs new" / "before vs after" comparison.
7. Convert a single high-signal sentence into a **quote-block** only from source text.
8. Convert end-of-doc checklist into **action-items** grid.
9. For marketing, tutorial, trend, or concept-explainer docs, generate or draft a **Xiaohongshu-style demo card**: one strong title, 3-5 short takeaways, one visual metaphor, no fabricated claims.
10. Apply theme's **inline highlight rules** (`<text color="...">**...**</text>`) for key terms — capped at 2 per paragraph for `technical-blue` / `warm-product`, 5 total for `clean-minimal`, looser for `vivid-marketing`.

Always confirm before:

- Overwriting an existing non-empty Feishu document or whiteboard.
- Inferring data to fill kpi-card-row, charts, quotes, or causal links.
- Major section reordering in an existing document.
- Using paid/private/brand-restricted assets or user-provided confidential images.

No extra confirmation is needed when the user explicitly asked for:

- a new visual Lark document;
- a flowchart/architecture diagram/timeline;
- cover images or illustrative images;
- Xiaohongshu-style cards;
- a strong visual redesign draft.

Still state assumptions briefly in the result.

## Proactive Skill Handoffs

Read `references/visual-enhancement-patterns.md` before adding images, diagrams, charts, social cards, or major layout changes.

Use other skills as part of this workflow, not as an afterthought:

| Need | Primary route | Skill/tool to use |
| --- | --- | --- |
| Flowchart, SOP, approval, deployment path | Lark whiteboard or Mermaid draft | `lark-whiteboard-cli` then `lark-whiteboard` |
| Architecture, modules, dependencies, data flow | Lark whiteboard DSL | `lark-whiteboard-cli` then `lark-whiteboard` |
| Timeline, roadmap, evolution, milestones | Lark component plus milestone whiteboard | `lark-whiteboard-cli` / `lark-whiteboard` |
| Infographic / information architecture | Route content into flow, sequence, structural, or illustrative diagrams | Borrow baoyu infographic/diagram routing; implement with Lark components and whiteboards |
| Local preview image for a diagram | Render PNG first, inspect, then upload/insert | `lark-whiteboard-cli`, `lark-doc` |
| Cover or illustration | Generated bitmap or legitimate public image URL | `imagegen`, then `lark-doc` media insert |
| Xiaohongshu/demo/social card | Dedicated XHS skill if installed; otherwise image prompt/card draft | `baoyu-xhs-images` if available, else `imagegen` or prompt under `tmp/` |
| Chart from explicit data | Native table, Mermaid, or whiteboard chart | `lark-whiteboard-cli`; never infer missing numbers |

Borrow baoyu-style visual routing when useful:

- XHS cards: choose a style, layout, color palette, and aspect ratio first; keep each card to one thesis and 3-5 short points.
- Infographics: map the source to timeline, process, comparison, hierarchy, cycle, funnel, or matrix before choosing visuals.
- Diagrams: route to flowchart, sequence, structural, illustrative, mind map, or class-style diagrams based on relationships in the text.
- Cover/illustration: define subject, mood, composition, and no-text vs text-overlay requirements before generation.

When creating or editing a real Feishu doc:

1. Use `lark-doc` to create/update the document body.
2. Insert blank whiteboard placeholders only when the next step can fill them.
3. Capture `board_tokens` from the response.
4. Fill every whiteboard with `lark-whiteboard +update`.
5. Insert generated/local images with `docs +media-insert`.
6. Verify no placeholder-only visual block remains.

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

## Visual Handoff References

Use `references/visual-enhancement-patterns.md` for visual decision rules and handoff prompts.
Use `references/lark-flavored-markdown.md` for Feishu XML syntax.
Use `references/themes-and-components.md` for theme, component, and artifact selection.

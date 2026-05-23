# Visual Enhancement Patterns

Use this reference when a Lark document needs more than deterministic Markdown cleanup.
The bias is visual-first: when the user asks for visual polish or a new polished
document, prefer producing real diagrams, timelines, images, infographics, and
social cards over suggestion-only callouts.

## Borrowed Patterns

- Open design / codesign repositories: treat visual work as an iterative design brief, not a blind formatter. Diagnose intent, propose visual directions, then ask before major redesign.
- Markdown beautifiers and live formatters: keep the formatting layer deterministic, idempotent, and safe around code, links, tables, and existing raw blocks.
- Flow-oriented Markdown tools: make process, architecture, timeline, and dependency content convertible into diagrams, especially Mermaid or Lark whiteboards.
- Baoyu-style skill collections: package repeatable workflows as installable skills with clear prompts and tool handoffs. Borrow the routing ideas from `baoyu-xhs-images`, `baoyu-infographic`, `baoyu-diagram`, `baoyu-cover-image`, and `baoyu-article-illustrator`; call those skills only if installed/available.

## Decision Matrix

| Content signal | Default visual output | Skill/tool route | Stop and ask when |
| --- | --- | --- |
| Process, workflow, approval, SOP | Flowchart or swimlane whiteboard | `lark-whiteboard-cli` -> `lark-whiteboard` | Roles, branches, or outcomes are missing |
| Architecture, dependency, module, topology | Architecture/dependency whiteboard | `lark-whiteboard-cli` -> `lark-whiteboard` | Relationships are inferred rather than explicit |
| Timeline, roadmap, release history | Timeline component plus milestone whiteboard | `lark-whiteboard-cli` milestone scene | Dates/order are ambiguous |
| Metrics, trend, cost, conversion | Table first; chart only from explicit data | Lark table, Mermaid, whiteboard chart | Numbers, units, or baseline are missing |
| Before/after, old/new, selection | Before-after component or comparison whiteboard | Component template, comparison scene | Criteria are not in source text |
| Summary, action items, owners | KPI cards and action-items grid | Beautifier components | Owners/deadlines are invented |
| Cover, campaign, case story | Cover image or hero callout | `imagegen`, public image URL, or local media insert | Brand, rights, or subject is unclear |
| Xiaohongshu/tutorial/demo | 1-3 social cards, each with one thesis and 3-5 bullets | `baoyu-xhs-images` if available, else `imagegen`/prompt | Claims would need invented data or testimonials |
| Concept explainer / knowledge map | Infographic or mind map | Borrow baoyu-infographic routing; implement with whiteboard or components | Hierarchy or categories are unclear |

## Baoyu-Style Routing

Use these borrowed patterns even when the baoyu skills are not installed:

- `baoyu-xhs-images`: pick card style, layout, color palette, and image ratio before generation. Keep text large, short, and factual.
- `baoyu-infographic`: map source structure to timeline, process, comparison, hierarchy, cycle, funnel, matrix, or map.
- `baoyu-diagram`: route diagrams to flowchart, sequence, structural, illustrative, mind map, or class-style diagrams based on relationships.
- `baoyu-cover-image`: generate a cover brief with subject, mood, composition, palette, and whether text belongs in the image or in Lark body.
- `baoyu-article-illustrator`: add section-level illustrations only where they clarify a concept, not as decoration.

## Permission Rule

Treat these user phrases as permission for the matching visual class:

- "强视觉版", "更好看", "图文并茂", "美化版" for components, diagrams, and safe local visual drafts.
- "画流程图", "架构图", "泳道图" for real whiteboard diagrams.
- "时间线", "路线图", "发展历程" for timeline or milestone visuals.
- "加图片", "封面图", "配图" for generated/local image drafts.
- "小红书", "演示图", "信息卡" for social card drafts or generated card images.

Still ask before overwriting existing non-empty Feishu content, using private/paid assets,
or inventing unsupported facts. For newly created documents, proceed with defaults and
state assumptions in the final note.

## Default Visual Deliverables

| Document type | Minimum visual package |
| --- | --- |
| Technical plan / architecture | Cover, architecture whiteboard, action-items |
| Process / SOP / runbook | Cover, flowchart or swimlane, checklist |
| Roadmap / release notes / trend report | Cover, KPI row, timeline/milestone visual, before-after |
| PRD | Cover, KPI row, before-after, user journey or workflow whiteboard |
| Meeting notes / retro | Decision callout, action-items, issue timeline if present |
| Weekly / status report | KPI row, status table, milestone strip, blockers callout |
| Marketing / Xiaohongshu | Cover, quote/thesis block, 1-3 social card prompts or images |
| Executive brief | Clean cover, KPI row, minimal dividers, no decorative social cards |

## Handoff Procedure

1. Run the proofreading pass from `copy-editing-and-emphasis.md` before adding visual artifacts.
2. Write intermediate visual sources under `tmp/` unless the target tool requires another path.
3. For whiteboards, read the relevant `lark-whiteboard-cli` scene guide, render a PNG preview, inspect for clipped text or overlaps, then upload/fill the Feishu board.
4. For images, use `imagegen` or a legitimate public URL; insert local files with `lark-cli docs +media-insert`.
5. For Xiaohongshu cards, prefer a dedicated XHS skill if installed. If not available, create a card prompt or generated bitmap with short text, large hierarchy, and factual claims only.
6. For charts, require explicit source data. If data is partial, keep a table and add a "needs data" note rather than fabricating a chart.
7. After write-back, verify no `<whiteboard type="blank"></whiteboard>` placeholder remains unfilled.

## Suggested Prompt When User Intent Is Ambiguous

```text
我可以把这篇飞书文档升级成强视觉版：加入封面/配图、飞书画板流程图、时间线、图表或小红书信息卡。当前缺少的是：{缺少的数据/风格/授权点}。请确认这一项后我继续执行。
```

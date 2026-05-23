# Visual Enhancement Patterns

Use this reference when a Lark document needs more than deterministic Markdown cleanup.

## Borrowed Patterns

- Open design / codesign repositories: treat visual work as an iterative design brief, not a blind formatter. Diagnose intent, propose visual directions, then ask before major redesign.
- Markdown beautifiers and live formatters: keep the formatting layer deterministic, idempotent, and safe around code, links, tables, and existing raw blocks.
- Flow-oriented Markdown tools: make process, architecture, timeline, and dependency content convertible into diagrams, especially Mermaid or Lark whiteboards.
- Baoyu-style skill collections: package repeatable workflows as installable skills with clear prompts and tool handoffs. For social-card output, route to `baoyu-xhs-images` style workflows only after user confirmation.

## Enhancement Menu

| Content signal | Safe default | Requires confirmation |
| --- | --- | --- |
| Process, workflow, approval, SOP | Add a visual suggestion callout | Insert Mermaid, whiteboard, or rewritten step structure |
| Architecture, dependency, module, topology | Suggest a component/dependency diagram | Generate a real diagram from inferred relationships |
| Metrics, trend, cost, conversion, comparison | Suggest chart/table treatment | Create charts from inferred or incomplete data |
| Summary, action items, milestones, roadmap | Suggest cards/timeline layout | Move sections or add new executive summary |
| Cover, campaign, case, story, Xiaohongshu | Suggest image/card workflow | Generate/upload images or run `baoyu-xhs-images` |

## Confirmation Rule

Ask the user before any bold transformation:

- generated or fetched images;
- actual chart, Mermaid, or whiteboard insertion;
- `baoyu-xhs-images` or other external visual generation;
- moving large sections or adding new sections;
- inferring data, relationships, or claims not explicitly present.

Without confirmation, only insert suggestions, normalize typography, convert high-confidence callouts, format obvious grids, and convert complex tables.

## Suggested Prompt For Bold Changes

```text
我可以把这篇飞书文档升级成更强的视觉版：加入封面/配图、Mermaid/画板流程图、图表或小红书信息卡。但这些会改变正文呈现方式。请确认允许我做哪些项：1）流程图/架构图，2）图表，3）封面或配图，4）小红书卡片，5）重排章节。
```

# Document Profiles

Use this reference when choosing the structure and visual treatment for a document.

## Modes

| Mode | Use For | Default Behavior |
|---|---|---|
| `safe` | Executive, legal, finance, high-stakes drafts | Conservative typography and high-confidence callouts only |
| `structured` | Normal PRDs, meeting notes, plans, technical documents | Callouts, grids, smart tables, whiteboard suggestions, visual suggestions |
| `bold` | User-approved optimization drafts and test documents | More aggressive tables and richer visual rhythm; Mermaid/prompt artifacts require explicit `--enhancements draft` |

Do not write `bold` output back to a live user document unless the user explicitly asked for a bold rewrite or approved the proposed visual changes.

## PRD

Recommended order:

1. Decision summary
2. Goals and non-goals
3. Users and scenarios
4. Requirements matrix
5. Milestones
6. Risks and open questions

Prefer native Feishu tables for requirements, priorities, owners, acceptance criteria, and risk matrices.

## Technical Plan

Recommended order:

1. One-screen summary
2. Architecture or dependency view
3. Decision matrix
4. Rollout plan
5. Validation plan
6. Risks and rollback

Suggest whiteboards for architecture, dependency, sequence, topology, and data-flow sections.

## Meeting Notes

Recommended order:

1. Decisions
2. Action items
3. Discussion summary
4. Risks and blockers
5. Follow-up questions

Prefer owner/status tables for action items. Avoid decorative changes.

## Weekly Report

Recommended order:

1. Highlights
2. Progress by workstream
3. Metrics or trend table
4. Blockers
5. Next week plan

Use charts only when real numeric data is present.

## Retro

Recommended order:

1. Outcome snapshot
2. What worked
3. What did not work
4. Root causes
5. Action items

Use cause-analysis whiteboards only after the user confirms the causal model.

## Social Or Campaign Draft

Recommended order:

1. Hook
2. Core points
3. Proof or case
4. Visual card plan
5. Publishing checklist

Use `baoyu-xhs-images` style workflows only after confirmation. Preserve claims and avoid inventing testimonials, numbers, or endorsements.

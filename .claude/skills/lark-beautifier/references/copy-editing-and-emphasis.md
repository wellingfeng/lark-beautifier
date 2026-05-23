# Copy Editing & Emphasis Rules

Use this reference before final layout and before creating/updating a Feishu document.

## Step 1: Proofread First

Correct only high-confidence issues:

- obvious typos, duplicate words, missing punctuation, wrong full-width/half-width punctuation;
- broken Chinese/English spacing around product names, API names, numbers, and units;
- inconsistent terms when the document itself establishes the canonical spelling;
- list numbering or heading punctuation that is visibly inconsistent.

Do not silently change:

- code, commands, config, URLs, file paths, API names, variable names;
- quoted text, legal/contract/medical/financial statements;
- claims, metrics, dates, owners, deadlines, or technical conclusions;
- ambiguous terminology that may be domain-specific.

When a correction is useful but uncertain, keep the source text and add a short suggestion callout:

```html
<callout emoji="✍️" background-color="light-yellow" border-color="yellow">
**文案校对建议**

“XXX” 可能应为 “YYY”，但需要作者确认术语口径。
</callout>
```

For newly generated documents, fix obvious wording directly. For existing user documents, avoid broad rewriting unless the user explicitly asks for content editing.

## Emphasis Levels

Use emphasis to guide scanning, not to decorate every sentence.

| Level | Use For | Preferred Styling | Limit |
| --- | --- | --- | --- |
| L1 key term | product names, modules, concepts | `**Lumen**` or `<text color="blue">**Lumen**</text>` | 1-2 per paragraph |
| L2 number/date | metrics, budgets, versions, dates | `<text color="green">**+20%**</text>`, `<text color="purple">**2026 Q2**</text>` | numbers only |
| L3 risk/constraint | blockers, caveats, must-not rules | `<text color="red">**风险**</text>` or `<u>必须先验证</u>` | max 3 underlines per doc |
| L4 thesis | section conclusion, executive takeaway | callout title, colored heading, or component card | 1 per section |

Color mapping for `technical-blue`:

- blue: product names, engine modules, core concepts;
- cyan/blue: workflow or integration terms;
- green: positive performance/result/ready state;
- red: risk, failure, unsupported behavior;
- orange: warning, experimental, migration caution;
- purple: date, version, phase, milestone;
- gray: background or optional detail.

## Feishu Markdown Syntax

Use only known Lark-flavored Markdown syntax:

```markdown
**bold**
*italic*
<u>underline</u>
<text color="blue">blue text</text>
<text background-color="yellow">yellow highlight</text>
# Colored heading {color="blue"}
## Center heading {color="blue" align="center"}
```

Supported text colors: `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `gray`.

Use underline only for actions, constraints, and "must read" caveats. Underline is visually loud in Feishu.

## Font Size Rule

Do not invent unsupported inline font-size tags.

Feishu OpenAPI text runs support bold, italic, strikethrough, underline, inline code, text color, background color, and links. They do not expose arbitrary inline `font-size` in the documented `TextElementStyle`. For larger/smaller hierarchy, use:

- document title for the largest text;
- H1/H2/H3 heading levels;
- colored heading attributes (`{color="blue"}`);
- callout titles for strong local emphasis;
- KPI cards / cover banners / generated images when a large display treatment is needed.

If a future tool adds verified font-size support, use it only after a dry run confirms the syntax.

## Density Guardrails

- One paragraph: max 2 inline highlights.
- One viewport/screen: max 3 different colors.
- One document: max 3 underlined phrases unless the user explicitly asks for heavy marking.
- Do not style every occurrence of the same term; style the first or most decision-relevant occurrence.
- Never apply color/underline inside fenced code, inline code, links, URLs, or raw Lark XML attributes.

## Good Example

```markdown
Lumen 的核心价值不是“让画面更亮”，而是让
<text color="blue">**动态全局光照**</text>、
<text color="blue">**反射**</text> 和
<text color="orange"><u>性能预算</u></text>
进入同一条生产管线。
```

## Bad Example

```markdown
<font size="24"><text color="red">**Lumen**</text></font>
<text color="green">动态</text><text color="purple">全局</text><text color="orange">光照</text>
```

Problems: unsupported font tag, too many colors, and emphasis no longer communicates priority.

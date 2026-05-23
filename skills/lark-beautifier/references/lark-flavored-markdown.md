# Lark-Flavored Markdown Reference

Use this reference when deciding whether to keep plain Markdown or emit Lark block markup.

## Supported Blocks

### Callout

Use callouts for short high-signal notes, warnings, conclusions, and recommendations.

```html
<callout emoji="💡" background-color="light-blue" border-color="blue">
提示内容。
</callout>
```

Common styles:

| Cue | Emoji | Background | Border |
|---|---|---|---|
| 提示 / 建议 / 注意 | 💡 | light-blue | blue |
| 结论 / 推荐 | ✅ | light-green | green |
| 风险 / 警告 | ⚠️ | light-red | red |
| 重点 / 关键 | 📌 | light-yellow | yellow |

### Inline Emphasis

Use inline emphasis for decision-relevant text, not decoration.

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

Use `<u>` sparingly for actions, constraints, or "must read" caveats. Use headings, callout titles,
and component cards for larger visual hierarchy; do not invent unsupported inline `font-size` tags.
For the full decision rules, read `copy-editing-and-emphasis.md`.

### Grid

Use grids for two or three comparable short sections.

```html
<grid cols="2">
<column>

**方案 A**

- 优点

</column>
<column>

**方案 B**

- 风险

</column>
</grid>
```

### Lark Table

Use `<lark-table>` only for complex or decision-oriented tables. Keep simple data tables as Markdown tables.

```html
<lark-table column-widths="160,240" header-row="true">
<lark-tr>
<lark-td>
**风险**
</lark-td>
<lark-td>
**缓解计划**
</lark-td>
</lark-tr>
<lark-tr>
<lark-td>
URL 被插入空格
</lark-td>
<lark-td>
跳过 link 和 inlineCode 节点
</lark-td>
</lark-tr>
</lark-table>
```

### Whiteboard

For visual-first documents, use whiteboards proactively for process, architecture,
timeline, dependency, org, and causal content. Insert a blank whiteboard only when
the workflow will immediately fill it through `lark-whiteboard` / `lark-whiteboard-cli`.
For existing high-stakes documents or ambiguous requests, use a suggestion callout first.

```html
<whiteboard type="blank"></whiteboard>
```

Do not leave a newly created Lark document with blank whiteboards. Capture `board_tokens`
from `docs +create` / `docs +update`, then update each board before considering the
task complete.

## Safety Rules

- Preserve facts and source meaning.
- Do not rewrite prose for style unless the user explicitly asks.
- Do not alter fenced code, inline code, links, image URLs, raw HTML, or existing Lark XML blocks.
- Render Lark XML blocks after generic Markdown formatting so they are not escaped.
- Use conservative mode for legal, financial, medical, or executive documents.
- Do not fabricate diagram relationships, chart values, image captions, or social-card claims.

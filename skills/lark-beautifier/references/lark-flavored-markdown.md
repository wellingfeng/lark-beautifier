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
<lark-table column-widths="160,240">
<thead>
<tr>
<th>风险</th>
<th>缓解计划</th>
</tr>
</thead>
<tbody>
<tr>
<td>URL 被插入空格</td>
<td>跳过 link 和 inlineCode 节点</td>
</tr>
</tbody>
</lark-table>
```

### Whiteboard

Default to a suggestion callout. Insert a blank whiteboard only when requested.

```html
<whiteboard type="blank"></whiteboard>
```

## Safety Rules

- Preserve facts and source meaning.
- Do not rewrite prose for style unless the user explicitly asks.
- Do not alter fenced code, inline code, links, image URLs, raw HTML, or existing Lark XML blocks.
- Render Lark XML blocks after generic Markdown formatting so they are not escaped.
- Use conservative mode for legal, financial, medical, or executive documents.


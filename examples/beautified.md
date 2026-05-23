# 项目计划

## 背景

这个工具用于把 Markdown 发到飞书 docs。

<callout emoji="💡" background-color="light-blue" border-color="blue">
不要改变原文事实，只做结构和排版优化。
</callout>

## 方案对比

<grid cols="2">
<column>

**方案 A**

- 快速落地
- 适合现有 lark-cli 流程

</column>
<column>

**方案 B**

- 需要更多集成
- 后续可生成真实画板

</column>
</grid>

## 风险矩阵

<lark-table column-widths="160,160,120,360" header-row="true">
<lark-tr>
<lark-td>
**风险**
</lark-td>
<lark-td>
**影响**
</lark-td>
<lark-td>
**负责人**
</lark-td>
<lark-td>
**缓解计划**
</lark-td>
</lark-tr>
<lark-tr>
<lark-td>
飞书 XML 被转义
</lark-td>
<lark-td>
文档块不可用
</lark-td>
<lark-td>
平台组
</lark-td>
<lark-td>
renderer 最后输出，不再交给通用 formatter
</lark-td>
</lark-tr>
<lark-tr>
<lark-td>
URL 被插入空格
</lark-td>
<lark-td>
链接损坏
</lark-td>
<lark-td>
工具组
</lark-td>
<lark-td>
AST 层跳过 link 和 inlineCode
</lark-td>
</lark-tr>
</lark-table>

## 系统架构图

<callout emoji="🧩" background-color="light-yellow" border-color="yellow">
建议为“系统架构图”补充飞书画板，后续可用 lark-whiteboard-cli 生成真实图示。
</callout>

后续可把解析、分析、渲染流程画成 whiteboard。

```ts
const url = "https://example.com/a?b=Markdown测试";
console.log(url);
```

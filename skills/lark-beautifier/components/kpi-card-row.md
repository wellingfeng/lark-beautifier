---
name: kpi-card-row
slot: under-cover or section-summary
when: 有 3-4 个并列的版本号/日期/指标/数量信息时
---

# Component: kpi-card-row

用 grid 把核心数字横向排成卡片。比表格更显眼，比单段更紧凑。

## 3 列模板

```markdown
<grid cols="3">
<column>

<callout emoji="🗓️" background-color="light-blue" border-color="blue">
**Preview**

<text color="blue">**2026.05**</text>

Epic Launcher / GitHub
</callout>

</column>
<column>

<callout emoji="🎯" background-color="light-green" border-color="green">
**Stable**

<text color="green">**2026.06**</text>

Unreal Fest Chicago
</callout>

</column>
<column>

<callout emoji="🏷️" background-color="light-purple" border-color="purple">
**Version**

<text color="purple">**5.8**</text>

UE 5 系列重要迭代
</callout>

</column>
</grid>
```

## 4 列模板（vivid-marketing）

```markdown
<grid cols="4">
<column>

<callout emoji="📈" background-color="light-green" border-color="green">
**下载量**

<text color="green">**+10w**</text>
</callout>

</column>
<column>

<callout emoji="⭐" background-color="light-yellow" border-color="yellow">
**评分**

<text color="orange">**4.9**</text>
</callout>

</column>
<column>

<callout emoji="🔥" background-color="light-red" border-color="red">
**留存**

<text color="red">**87%**</text>
</callout>

</column>
<column>

<callout emoji="💰" background-color="light-purple" border-color="purple">
**ARPU**

<text color="purple">**¥38**</text>
</callout>

</column>
</grid>
```

## 反模式

- 每张卡片正文超过 3 行 —— 失去「一眼可见」的价值
- 卡片间数字单位不一致（百分比/绝对值/比率混在一起）
- 用饱和色块包真实但无法核实的数据

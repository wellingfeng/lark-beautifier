---
name: cover-banner
slot: top
when: 每篇文档必备（极简主题除外可降级）
---

# Component: cover-banner

文档开篇的视觉锚点。结构：横幅图（可选）→ 大标题/副标题 callout → KPI 一字排开。

## 完整版（technical-blue / warm-product / vivid-marketing）

```markdown
<image url="https://example.com/cover.jpg" width="1024" align="center" caption="副标题：一句话定位"/>

<callout emoji="🎮" background-color="light-blue" border-color="blue">
**TL;DR：** 一句话核心信息。包含 **关键术语**、**版本号**、**时间点** 三个锚点。本次更新聚焦 **A、B、C** 三个主题。
</callout>
```

## 极简版（clean-minimal，无图）

```markdown
<callout emoji="📌" background-color="light-gray" border-color="gray">
**决策摘要：** 一句话。后续 X 项行动。
</callout>
```

## 反模式

- 不要在 cover-banner 用本地路径图片，飞书无法访问 —— 必须公网 URL
- 不要把 TL;DR 写超过 3 句话 —— 它的作用是「电梯演讲」
- 不要在 cover-banner 后立刻又写一段「概述」 —— 信息重复

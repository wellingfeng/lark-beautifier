---
name: clean-minimal
description: 高管/对外向极简主题。适合战略备忘、对外简报、董事会材料、合规文档。
audience: executive, external
mood: restrained, authoritative, sparse
---

# Theme: clean-minimal

## 设计 Token

| 角色 | 颜色 | 何处使用 |
| --- | --- | --- |
| primary | gray | 主要强调（深灰）；颜色克制 |
| accent | blue | 极少量强调（仅 1-2 处） |
| success | green | 仅用于明确正向结果 |
| danger | red | 仅用于明确风险或拒绝 |
| neutral | gray | 大量留白和灰阶 |

## 行内强调规则

- 全文行内高亮 ≤ 5 处
- 仅用 **粗体** 和单一颜色 `<text color="blue">...</text>`
- 不使用 emoji 装饰（除非 callout 内部）

## Callout 配色映射

| 用途 | emoji | background-color | border-color |
| --- | --- | --- | --- |
| 决策 | 📌 | light-gray | gray |
| 风险 | ⚠️ | light-red | red |
| 正向结果 | ✅ | light-green | green |
| 补充资料 | 📎 | light-gray | gray |

## 组件偏好

1. **cover-banner**（极简版：无图，单 callout + 标题）
2. **kpi-card-row** —— 数据卡片，最多 3 个
3. **section-divider** —— 仅用横线 + 章节号，不用 emoji
4. **action-items** —— 决议清单

## 反模式

- 不要用彩色背景或多种 callout 颜色
- 不要插入 Mermaid 图、霓虹色块、emoji 章节符
- 不要在高管文档加 baoyu-xhs-images 卡片

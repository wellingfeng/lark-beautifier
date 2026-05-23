---
name: technical-blue
description: 工程师面向的冷静蓝调主题。适合技术方案、Release Notes、架构评审、SDK 文档。
audience: engineer
mood: calm, precise, trustworthy
---

# Theme: technical-blue

## 设计 Token（飞书 Lark 可用色）

| 角色 | 颜色 | 何处使用 |
| --- | --- | --- |
| primary | blue | 主行动、主标题强调 |
| accent | cyan | 次级强调、链接、徽标 |
| success | green | 正向数据、改善、绿灯 |
| danger | red | 风险、警告、回退路径 |
| neutral | gray | 中性内容、可选项、背景信息 |
| highlight | yellow | 关键术语、版本号、品名（节制） |

## 行内强调规则（关键）

- 版本号、关键术语、产品名：`<text color="blue">**5.8**</text>`
- 性能数据（提升/改善）：`<text color="green">**↑ 20%**</text>`
- 性能数据（下降/风险）：`<text color="red">**↓ 0.1ms**</text>`
- 时间点、日期：`<text color="purple">**2026 年 6 月**</text>`
- 实验性 / Preview 标记：`<text color="orange">**实验性**</text>`
- 必须执行 / 不可跳过的动作：`<text color="orange"><u>先完成 GPU Profile</u></text>`
- 大字号层级用 H2/H3、callout 标题、KPI 卡片或封面卡实现；不要使用未验证的 `<font size>` 标签。

> 一段正文里最多 2 处行内高亮，超过会变成杂讯。

## Callout 配色映射

| 用途 | emoji | background-color | border-color |
| --- | --- | --- | --- |
| TL;DR / 总览 | 🎯 | light-blue | blue |
| 提示 / 说明 | 💡 | light-blue | blue |
| 结论 / 成功 | ✅ | light-green | green |
| 风险 / 警告 | ⚠️ | light-yellow | yellow |
| 阻断 / 错误 | 🛑 | light-red | red |
| 实验性 / 新特性 | 🧪 | light-purple | purple |
| 平台 / 集成 | 🥽 | light-orange | orange |
| 中性 / 备忘 | 📝 | light-gray | gray |

## 组件偏好

按出现顺序：

1. **cover-banner**（必选）：开篇必须有视觉锚点
2. **kpi-card-row**（强烈推荐）：版本信息、关键数据用 3-4 列卡片
3. **section-divider**（推荐）：每个一级章节前加分隔
4. **before-after**（按需）：版本对比、机制对比
5. **timeline**（按需）：版本/迭代/路线图
6. **quote-block**（按需）：核心洞察、警句
7. **action-items**（按需）：升级清单、检查项

## 反模式

- 不要在工程文档里用 vivid-marketing 的霓虹粉、亮橙整段背景
- 不要把所有段落都包成 callout —— callout 是「值得停顿」的信号
- 不要在同一屏堆超过 3 个不同颜色的 callout

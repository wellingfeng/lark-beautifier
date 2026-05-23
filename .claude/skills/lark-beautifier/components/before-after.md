---
name: before-after
slot: comparison
when: 版本对比、机制对比、改版前后
---

# Component: before-after

两栏 grid，左旧右新，用 callout 颜色暗示「降级 vs 升级」。

## 标准版（technical-blue）

```markdown
<grid cols="2">
<column>

<callout emoji="🪨" background-color="light-gray" border-color="gray">
**Before：传统 Heightfield**

- 基于高度图，2.5D 表达
- 全地形统一分辨率
- 难以表现悬崖 / 洞穴
- 修改流程偏破坏性
</callout>

</column>
<column>

<callout emoji="🏔️" background-color="light-green" border-color="green">
**After：Mesh Terrain（5.8）**

- 基于 3D 网格，真 3D 表达
- 分辨率局部可变
- 原生支持悬崖、洞穴、垂直峭壁
- 非破坏性 modifier，可堆叠 / 复制 / 变换
</callout>

</column>
</grid>
```

## 何时不用 before-after

- 对比项 ≥ 3 个：改用 lark-table，避免横向 grid 拥挤
- 对比内容超过 5 个 bullet 一栏：拆成 H3 并列章节，加一个 quote-block 总结差异
- 仅有 2-3 字的对比（如「A vs B」选哪个）：用单段加 `<text color>` 高亮即可

## 反模式

- 左右两边 bullet 数差距过大（一边 6 条一边 1 条）
- 用相同颜色 callout —— 失去对比信号
- 「After」一栏写承诺/未验证内容

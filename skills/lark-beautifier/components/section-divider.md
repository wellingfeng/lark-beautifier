---
name: section-divider
slot: before-h2
when: 文档超过 5 个一级章节时使用，给读者明确的「换章节」节奏
---

# Component: section-divider

代替默认 H2 的视觉感受。让长文档每 2-3 屏出现一次明确的视觉重启。

## 标准版（technical-blue / warm-product）

```markdown
---

## 🏔️ 二、Mesh Terrain（实验性）

> 全新地形系统，3D 网格架构，与 PCG 原生兼容。

```

要点：

- `---` 横线作为硬分隔
- H2 标题前置 emoji（与章节主题相关）
- 紧跟一句斜体或引用风格的「章节摘要」，让读者扫到标题就知道本章主旨

## rich 密度：大段落色块版

长技术文档、教程、白皮书适合用更明显的章节色块，但每个 H2 只放一个：

```markdown
---

## 🧱 二、Nanite 的数据结构

<callout emoji="📌" background-color="light-blue" border-color="blue">
**本节导读**

Nanite 不是“自动 LOD 按钮”，而是一套把超高面数网格切成层级 Cluster 并按屏幕误差流式选择的几何系统。
</callout>

### 小段机制

高模 Mesh → Cluster 切分 → 层级树构建 → 显存流送 → GPU 可见性裁剪 → 光栅化
```

原则：

- H2 / 大段解释：明显色块建立阅读分区。
- H3 / 小段机制：用数据流、短表格、细分割线建立节奏。
- 不要把每个小段都升级为 callout；色块只服务章节停顿。

## vivid-marketing 版（更跳）

```markdown
---

## 🔥 限时活动：3 天倒计时

<callout emoji="⏰" background-color="light-orange" border-color="orange">
**12.12-12.14**，错过等明年。本节告诉你 **怎么领、领什么、领多少**。
</callout>

```

## clean-minimal 版

```markdown
---

## 二、决策

```

（仅横线 + 序号 H2，无 emoji 无摘要）

## 反模式

- 每个 H2 都堆 emoji —— 全篇花哨等于没有重点
- 章节摘要超过 2 行 —— 它是「先看完这句决定要不要读」的引子

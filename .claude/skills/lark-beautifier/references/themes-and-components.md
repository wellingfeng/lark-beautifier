# Themes & Components (v2)

lark-beautifier v2 把视觉决策拆成两层：

- **主题（Theme）**：调色板 + emoji 风格 + 行内强调规则 + Callout 配色映射 + 反模式。
- **组件（Component）**：可复用的 Lark Markdown 块模板（cover-banner、kpi-card-row 等）。

主题决定「这个文档长什么样」，组件决定「这一段用什么块」。

## 主题选择决策表

| 文档类型 | 受众 | 推荐主题 | 备选 |
| --- | --- | --- | --- |
| Release Notes、技术方案、SDK 文档、架构评审 | 工程师 | `technical-blue` | `clean-minimal` |
| PRD、需求评审、功能介绍、用户故事 | 产品/运营 | `warm-product` | `vivid-marketing`（对外稿） |
| 战略备忘、董事会材料、合规文档、对外简报 | 高管/外部 | `clean-minimal` | —— |
| 发布稿、活动预告、案例故事、小红书草稿 | 营销/社区 | `vivid-marketing` | `warm-product` |
| 周报、复盘 | 跨职能 | `warm-product` 或 `clean-minimal` | —— |

如果用户没指定，按「最少惊讶原则」选 `technical-blue`（默认）或匹配的文档类型主题。

## 主题文件清单

- [themes/technical-blue.md](../themes/technical-blue.md)
- [themes/warm-product.md](../themes/warm-product.md)
- [themes/clean-minimal.md](../themes/clean-minimal.md)
- [themes/vivid-marketing.md](../themes/vivid-marketing.md)

## 组件与视觉产物清单

| 类型 | 位置 | 必选 / 可选 |
| --- | --- | --- |
| [cover-banner](../components/cover-banner.md) | 文首 | 必选（clean-minimal 可降级） |
| [kpi-card-row](../components/kpi-card-row.md) | cover 下方 / 章节摘要 | 强烈推荐 |
| [section-divider](../components/section-divider.md) | 每个一级章节前 | 推荐 |
| [before-after](../components/before-after.md) | 对比章节 | 按需 |
| [timeline](../components/timeline.md) | roadmap / 发布计划 | 按需 |
| [quote-block](../components/quote-block.md) | 强调金句 | 按需 |
| [action-items](../components/action-items.md) | 文末 | 按需 |
| 飞书画板流程图 / 架构图 / 时间线 | 对应章节后 | 强视觉文档优先 |
| 封面图 / 段首图 | 文首 / 关键章节 | 明确要求图文并茂时优先 |
| 信息图 / 小红书演示图 | 文末传播包 / 营销章节 | 营销、教程、趋势文档优先 |

## 推荐组合（模板化「视觉骨架」）

### Release Notes / 技术方案（technical-blue）

```text
cover-banner (有大图)
↓
kpi-card-row (版本、日期、范围) ×1
↓
architecture / milestone whiteboard（架构或演进）
↓
section-divider + before-after  ← 头号特性章节
↓
section-divider + 正文 + 行内高亮
↓
... 其他章节
↓
quote-block (官方表述 / 资深用户)
↓
timeline (升级路径) 或 action-items (升级清单)
```

### PRD（warm-product）

```text
cover-banner (产品名 + 价值主张)
↓
kpi-card-row (目标指标)
↓
section-divider + 用户故事章节
↓
before-after (改版前/后)
↓
quote-block (用户访谈原话)
↓
action-items (上线计划 + 负责人)
```

### 高管简报（clean-minimal）

```text
cover-banner (极简版，无图)
↓
kpi-card-row (3 个核心数字)
↓
section-divider (无 emoji)
↓
正文（克制使用 callout）
↓
action-items (极简版，普通 todo 清单)
```

### 营销稿 / 小红书草稿（vivid-marketing）

```text
cover-banner (大图 + 大字号 callout + 限时元素)
↓
kpi-card-row (4 列数据冲击)
↓
quote-block (用户/媒体好评)
↓
before-after (改版前/后对比)
↓
action-items (福利领取/参与方式)
↓
小红书信息卡 / 演示图（优先真实生成或给出可执行 prompt）
```

### 趋势报告 / 科普文章（technical-blue 或 vivid-marketing）

```text
cover-banner (一句话判断 + 视觉隐喻)
↓
kpi-card-row (时间跨度、关键节点数、当前阶段)
↓
timeline / milestone whiteboard（发展历程）
↓
section-divider + 主题章节
↓
flowchart / flywheel whiteboard（工作方式或生态闭环）
↓
小红书信息卡（可传播摘要）
```

## 内容信号 → 组件推荐

| 文本里出现 | 触发组件 |
| --- | --- |
| 「TL;DR」「总结」「概述」 + 开头 | cover-banner |
| 3-4 个并列的数字 / 日期 / 版本号 | kpi-card-row |
| 「之前 / 现在」「旧 / 新」「Before / After」「传统 / XX 新增」 | before-after |
| 「阶段一 / 阶段二」「Phase 1」「2026.05 / 2026.06」 | timeline |
| 「近几年」「发展历程」「路线图」「从 X 到 Y」 | timeline + milestone whiteboard |
| 「流程」「链路」「审批」「部署」「状态机」 | flowchart / swimlane whiteboard |
| 「架构」「模块」「依赖」「调用」「拓扑」 | architecture whiteboard |
| 引号包裹的句子 + 出处（—— XXX） | quote-block |
| 「升级清单」「行动项」「待办」「TODO」「checklist」 + 文末 | action-items |
| 任何 H2 + 长文档（≥5 章） | section-divider |
| 「小红书」「种草」「教程」「演示图」「传播」 | Xiaohongshu-style card |

## 章节节奏：大色块，小数据流

借鉴图文长文的阅读节奏，但落地时保持飞书可维护：

- **大段落 / H2 主章节**：长文档里用 `section-divider` + 主题色导读 callout。它承担“换章节”的停顿点，颜色可以明显一点，但每个 H2 只放一个。
- **小段落 / H3-H4 机制说明**：优先使用 `输入 → 处理 → 输出`、`资源准备 → 构建 → 渲染`、阶段短链、细分割线 `---`、小表格或普通列表。不要把每个小段都包成 callout。
- **流程密集内容**：如果箭头链路超过 5 个节点，升级为 flowchart / whiteboard；如果只有 2-4 个节点，用一行数据流即可。
- **代码解释**：代码块保持原样，代码前后用短句或表格解释“这段代码做什么 / 初学者容易错在哪里”，不要把代码放进 callout。

推荐写法：

```markdown
---

## 🧱 二、Nanite 的数据结构

<callout emoji="📌" background-color="light-blue" border-color="blue">
**本节导读**

Nanite 不是“自动 LOD 按钮”，而是一套把超高面数网格切成层级 Cluster 并按屏幕误差流式选择的几何系统。
</callout>

### 数据流

高模 Mesh → Cluster 切分 → 层级树构建 → 磁盘/显存流送 → GPU 可见性裁剪 → 光栅化
```

## 重点标注路由

所有主题都先读 `copy-editing-and-emphasis.md`，再按主题上色：

| 内容类型 | technical-blue | warm-product | clean-minimal | vivid-marketing |
| --- | --- | --- | --- | --- |
| 产品 / 模块 / 技术术语 | blue bold | purple bold | bold only or blue | purple/orange bold |
| 正向指标 / 已达成 | green bold | green bold | bold only | green bold |
| 风险 / 阻断 / 不支持 | red bold or callout | red bold | callout, little color | red/orange bold |
| 日期 / 版本 / 阶段 | purple bold | orange/purple bold | gray or bold | purple bold |
| 必须执行的动作 | underline + orange/blue | underline + orange | underline only | underline + orange |

不要用颜色替代结构。重要结论优先用 callout、卡片或标题层级；行内颜色只标记真正影响读者决策的词。

## 视觉密度

| 密度 | 自动组件行为 |
| --- | --- |
| `minimal` | 只保留最稳的 cover-banner 和 action-items；不加 section-divider、kpi-card-row、timeline、before-after、quote-block |
| `balanced` | 默认密度；允许 cover-banner、section-divider、action-items、kpi-card-row、timeline、before-after |
| `rich` | 在 balanced 基础上允许 quote-block，并给 section-divider 增加原文首句摘要 |

## 反模式（全局）

- 不要在一篇文档里同时混用 ≥ 2 个主题
- 不要把所有组件都用上 —— 不是每篇文档都需要 timeline / before-after
- 不要包装/伪造数据来填 kpi-card-row 或 quote-block
- 不要在长文档完全不用 section-divider —— 读者会迷路
- 不要在 clean-minimal 主题里出现彩色背景 callout 或 emoji 章节标题
- 不要只插入空白画板 —— 创建后必须填充真实图示
- 不要用无授权图片或无法公开访问的图片 URL

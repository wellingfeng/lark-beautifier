# Lark Beautifier 开发计划

## 背景

飞书文档更适合使用结构化的 Lark-flavored Markdown，而不是直接导入普通 HTML。普通 Markdown 经过简单格式化后虽然更整齐，但仍然容易呈现为“标题 + 大段文字 + 普通表格”的单调文档。

本项目目标是开发一个面向飞书文档的 Markdown 美化工具，把普通 Markdown 转换为更适合飞书阅读体验的 Lark-flavored Markdown，包括 callout、grid、lark-table、whiteboard 等飞书块语法。

## 目标

1. 输入普通 Markdown，输出飞书友好的 Lark-flavored Markdown。
2. 保留原文语义，不重写内容，不擅自增删事实。
3. 自动改善文档结构、视觉节奏和中文排版。
4. 为后续封装成 Codex / Claude skill 留出清晰接口。
5. 支持在 CLI、本地脚本和飞书文档创建流程中复用。

## 非目标

1. 不做完整网页 HTML/CSS 渲染。
2. 不追求像 Word 一样的像素级排版。
3. 第一阶段以生成可提交的 Markdown 为主；真实飞书写回优先走 `@larksuiteoapi/lark-mcp` OAuth 授权码流程 + Feishu OpenAPI，避免依赖 `lark-cli auth login` 的设备码流程。
4. 不使用 LLM 作为唯一格式化手段；核心转换应尽量可测试、可复现。

## 推荐技术方案

### 核心流水线

```text
Markdown 输入
  -> remark/unified 解析 AST
  -> 结构分析与块级识别
  -> 中文排版处理
  -> Lark-flavored Markdown 渲染
  -> markdownlint/快照测试校验
  -> 输出 .md
```

### 工具选择

| 能力 | 推荐工具 | 用途 |
|---|---|---|
| Markdown AST | `unified` + `remark-parse` + `remark-gfm` | 解析标题、列表、表格、HTML、代码块 |
| Markdown 输出 | `remark-stringify` 或自定义 renderer | 输出可控 Markdown |
| 中文排版 | `autocorrect` 或 JS 封装 | 中英文空格、标点、全角半角 |
| 格式校验 | `markdownlint-cli2` | 标题层级、空行、列表缩进等 |
| 测试 | `vitest` | 单元测试、快照测试 |
| CLI | `tsx` / `commander` | 本地命令行入口 |

## 核心能力设计

### 1. 基础 Markdown 整理

- 统一标题层级，避免跳级。
- 清理多余空行。
- 统一列表缩进。
- 为代码块补全语言标识。
- 规范表格前后空行。
- 保留 frontmatter。
- 保留原有链接、图片、代码块和 HTML 块。

### 2. 中文排版优化

- 中英文、数字之间补空格。
- 中文标点统一为全角。
- 英文标点与英文语境保持半角。
- 删除重复空格。
- 避免破坏代码块、链接 URL、行内代码。

### 3. 飞书 Callout 转换

识别适合高亮的信息块，并转换为 `<callout>`。

规则示例：

| 输入特征 | 输出 |
|---|---|
| `注意：`、`风险：`、`警告：` | 黄色或红色 callout |
| `提示：`、`建议：` | 蓝色 callout |
| `结论：`、`推荐：` | 绿色 callout |
| Markdown blockquote 中包含提示语 | callout |

示例输出：

```html
<callout emoji="💡" background-color="light-blue" border-color="blue">
这里是提示内容。
</callout>
```

### 4. Grid 分栏转换

识别对比、方案、选项、优缺点等并列内容，转换为 `<grid>`。

适用场景：

- “方案 A / 方案 B”
- “推荐 / 不推荐”
- “优点 / 缺点”
- “现在 / 未来”
- 两到三组短内容对比

输出示例：

```html
<grid cols="2">
<column>

**方案 A**

- 优点
- 风险

</column>
<column>

**方案 B**

- 优点
- 风险

</column>
</grid>
```

### 5. Lark Table 转换

普通表格默认保留 Markdown 表格；当单元格内容复杂时转换为 `<lark-table>`。

转换条件：

- 单元格内包含列表。
- 单元格内容过长。
- 表格用于决策矩阵、风险矩阵、排期计划。
- 需要固定列宽。

### 6. Whiteboard 占位建议

第一阶段不直接生成画板内容，只生成可选占位或建议。

识别场景：

- 架构图
- 流程图
- 时间线
- 组织结构
- 因果分析
- 系统依赖关系

可配置输出：

```html
<whiteboard type="blank"></whiteboard>
```

后续阶段再与 `lark-whiteboard-cli` 集成，自动生成真实画板内容。

## CLI 设计

### 基础命令

```bash
lark-beautifier input.md -o output.md
```

### 推荐参数

```bash
lark-beautifier input.md \
  --output output.md \
  --profile lark \
  --language zh-CN \
  --callouts auto \
  --grids auto \
  --tables smart \
  --whiteboards suggest
```

### 参数说明

| 参数 | 说明 |
|---|---|
| `--profile` | 输出风格，默认 `lark` |
| `--language` | 文档语言，默认 `zh-CN` |
| `--callouts` | `off` / `auto` / `conservative` |
| `--grids` | `off` / `auto` / `conservative` |
| `--tables` | `markdown` / `smart` / `lark` |
| `--whiteboards` | `off` / `suggest` / `insert-blank` |
| `--check` | 只检查，不写文件 |
| `--diff` | 输出转换前后差异 |

## 项目结构

```text
E:\lark-beautifier
├── README.md
├── DEVELOPMENT_PLAN.md
├── package.json
├── tsconfig.json
├── src
│   ├── cli.ts
│   ├── index.ts
│   ├── parser.ts
│   ├── analyzer.ts
│   ├── renderer
│   │   ├── markdown.ts
│   │   └── lark.ts
│   ├── transforms
│   │   ├── callouts.ts
│   │   ├── grids.ts
│   │   ├── tables.ts
│   │   ├── typography.ts
│   │   └── whiteboards.ts
│   └── config.ts
├── tests
│   ├── fixtures
│   ├── callouts.test.ts
│   ├── grids.test.ts
│   ├── tables.test.ts
│   └── snapshots.test.ts
└── examples
    ├── raw.md
    └── beautified.md
```

## 开发阶段

### Phase 1：MVP

目标：能稳定把普通 Markdown 转成更干净的 Lark-flavored Markdown。

任务：

- 初始化 TypeScript 项目。
- 接入 `unified`、`remark-parse`、`remark-gfm`。
- 实现 CLI 输入输出。
- 实现基础 Markdown 清理。
- 实现中文排版处理的安全边界。
- 增加快照测试。

验收标准：

- 能处理标题、段落、列表、表格、代码块。
- 不破坏代码块、链接、图片。
- 输出可被 `lark-cli docs +create --markdown` 使用。

### Phase 2：飞书块美化

目标：输出明显更适合飞书阅读的文档。

任务：

- 实现 callout 自动识别。
- 实现 grid 自动识别。
- 实现复杂表格到 `<lark-table>` 的转换。
- 实现 whiteboard 场景提示或空白占位。
- 增加 `--conservative` 保守模式。

验收标准：

- 技术方案、会议纪要、PRD、复盘文档均有明显视觉改善。
- 转换规则可配置。
- 所有转换都有 fixture 覆盖。

### Phase 3：飞书工作流集成

目标：和现有飞书 CLI 工作流顺滑连接。

任务：

- 增加 `--to-lark-cli` 输出模式，生成可复制执行的 `lark-cli docs +create` 命令片段。
- 支持分段输出，避免大文档一次提交失败。
- 与 `lark-whiteboard-cli` 设计集成接口。
- 生成 Codex / Claude skill 文档。

验收标准：

- 用户可以从本地 Markdown 一步得到飞书友好 Markdown。
- 可选生成飞书创建/更新命令。
- skill 文档能指导 agent 正确调用工具。

## 测试策略

### 单元测试

- 标题层级调整。
- callout 识别。
- grid 识别。
- 表格转换。
- 中文排版。
- 代码块保护。
- HTML/XML 标签保护。

### 快照测试

为以下文档类型建立 fixture：

- PRD
- 技术方案
- 会议纪要
- 周报
- 复盘
- 项目计划
- API 文档

### 回归测试

重点防止：

- 飞书 XML 标签被转义。
- `<grid>` / `<column>` 空行被破坏。
- `<lark-table>` 层级错误。
- 代码块内容被中文排版工具修改。
- URL 被插入错误空格。

## 风险与对策

| 风险 | 对策 |
|---|---|
| 自动美化过度改变作者意图 | 默认保守模式，只做高置信转换 |
| 飞书 XML 标签被 formatter 破坏 | Lark renderer 最后执行，不再经过通用 formatter |
| 普通 Markdown 表格转 lark-table 后变复杂 | 仅复杂表格转换，简单表格保留 |
| 中文排版影响代码或 URL | AST 层跳过 code、inlineCode、link、html |
| whiteboard 只创建空白内容 | MVP 只建议，不默认插入；后续集成真实画板生成 |

## Skill 封装方向

后续可封装为 `lark-beautifier` skill：

```text
触发场景：
- 用户要把 Markdown 发到飞书
- 用户说飞书文档不好看
- 用户要求美化会议纪要/PRD/技术方案
- 用户提供 Markdown 并要求生成飞书文档

执行流程：
1. 判断文档类型
2. 调用 beautifier 生成 Lark-flavored Markdown
3. 如果需要创建飞书文档，调用 lark-doc
4. 如果包含画板，占位后继续调用 lark-whiteboard-cli 填充内容
```

## 第一版交付清单

- `README.md`
- `DEVELOPMENT_PLAN.md`
- 可运行 CLI
- 10 个以上 fixture
- 基础转换规则
- 快照测试
- 飞书文档示例输出

## 下一步

1. 初始化 Node/TypeScript 项目。
2. 建立 `examples/raw.md` 和 `examples/beautified.md`。
3. 实现最小 CLI。
4. 先完成 callout 和中文排版两条最有价值的转换。
5. 用真实飞书文档创建流程验证输出。

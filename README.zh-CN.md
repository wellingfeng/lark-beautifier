# Lark Beautifier

[English README](README.md)

Lark Beautifier 是一个 Node.js / TypeScript CLI，也是一套可安装的 Agent Skill，用来把普通 Markdown 转成适合飞书 / Lark 阅读和写回的文档。它不会重写事实和结论，而是在保留原文语义的前提下改善结构、节奏、飞书组件和视觉表达。

当前 v3 方向是“视觉优先”：工具仍然保留中文排版、callout、grid、智能表格等安全格式化能力，但 Skill 在用户要求“美化 / 强视觉版 / 图文并茂 / 新建视觉文档”时，会主动编排封面、章节分隔、时间线、行动项、飞书画板、流程图、架构图、配图、信息图和小红书演示卡片。

## 能力

- 清理中文排版，不破坏代码块、行内代码、链接、图片 URL、HTML 和已有 Lark XML。
- 把高置信提示语转换为飞书风格 callout。
- 把对比型内容转换为 grid 分栏。
- 把复杂 Markdown 表格转换为更适合飞书的智能表格，并按列语义设置宽度。
- 把风险模式和视觉风格拆开：`safe | structured | bold` 控制安全边界，`theme` 和 `visualDensity` 控制视觉表达。
- 支持可复用组件：`cover-banner`、`section-divider`、`timeline`、`before-after`、`quote-block`、`kpi-card-row`、`action-items`。
- 可输出白板、Mermaid、图表、图片提示词、小红书卡片等视觉建议或草案。
- 内置 dry-run-first 的飞书 OpenAPI 写回脚本，优先使用 `@larksuiteoapi/lark-mcp` OAuth 授权码流程。

## 安装 CLI

```bash
npm install
npm run build
```

开发模式运行：

```bash
npm run dev -- examples/raw.md -o examples/beautified.md --mode structured
```

构建后运行：

```bash
node dist/cli.js input.md --output output.md --mode structured
```

## CLI 用法

```bash
node dist/cli.js input.md \
  --output output.md \
  --mode structured \
  --theme technical-blue \
  --visual-density rich \
  --components auto \
  --callouts auto \
  --grids auto \
  --tables smart \
  --whiteboards suggest \
  --enhancements suggest
```

风险模式：

| 模式 | 适用场景 |
| --- | --- |
| `safe` | 高风险、高管、法务、财务类文档，只做保守排版和高置信结构化。 |
| `structured` | 默认模式，适合 PRD、会议纪要、技术方案、周报、复盘和项目文档。 |
| `bold` | 用户明确要求强视觉或测试文档时使用，会生成更丰富的视觉草案。 |

视觉主题：

| 主题 | 适用场景 |
| --- | --- |
| `technical-blue` | 技术方案、架构文档、API 文档、发布说明。 |
| `warm-product` | PRD、产品规划、用户故事、上线方案。 |
| `clean-minimal` | 高管简报、外部文档、合规敏感内容。 |
| `vivid-marketing` | 营销稿、活动页、社媒内容、演示脚本。 |

组件控制：

```bash
# 让 analyzer 自动选择高置信组件。
node dist/cli.js input.md -o output.md --components auto --theme auto

# 只启用指定组件。
node dist/cli.js input.md -o output.md --components cover-banner,section-divider,action-items

# 输出文档分析信号 JSON。
node dist/cli.js input.md --analyze --check 2> analysis.json
```

常用校验参数：

- `--check`：如果文件会被修改则返回非零退出码。
- `--diff`：打印 unified diff。
- `--conservative`：降低有风险的自动转换。
- `--to-lark-cli`：输出旧版 `lark-cli docs +create` 命令，便于把结果创建为飞书文档。

## 安装为 Skill

Codex Skill 的 canonical 源目录是：

```text
skills/lark-beautifier
```

安装到 Codex：

```bash
git clone https://github.com/wellingfeng/lark-beautifier.git
cp -R lark-beautifier/skills/lark-beautifier ~/.codex/skills/
```

Windows PowerShell：

```powershell
git clone https://github.com/wellingfeng/lark-beautifier.git
Copy-Item -Recurse lark-beautifier\skills\lark-beautifier $env:USERPROFILE\.codex\skills\
```

之后让 Codex 使用 `$lark-beautifier` 即可。

Claude Code 镜像目录保持同步在：

```text
.claude/skills/lark-beautifier
```

项目级 Claude Code 安装：

```bash
mkdir -p .claude/skills
cp -R lark-beautifier/.claude/skills/lark-beautifier .claude/skills/
```

## 飞书写回

写回脚本默认 dry-run，只生成计划，不修改真实文档：

```bash
node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input examples/beautified.md \
  --mode structured \
  --plan-output tmp/writeback-plan.json
```

确认计划后，再显式加 `--apply` 写回：

```bash
LARK_MCP_APP_ID=<app_id> node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input examples/beautified.md \
  --mode structured \
  --apply
```

如果使用 `--mode bold`，真实写回前还需要用户确认并额外传入 `--confirm-bold`。

首次登录优先使用 Lark MCP OAuth 授权码流程：

```bash
npx -y @larksuiteoapi/lark-mcp login -a <app_id> -s <app_secret> -p 8765 --host 127.0.0.1
```

不要提交 app secret、access token、refresh token 或本地 OAuth 存储文件。

## 开发与校验

```bash
npm test
npm run check
npm run build
npm run lint:md
npm run check:skills
node skills/lark-beautifier/scripts/self-check.mjs
npm run package:skill
```

Skill 的 canonical 源头是 `skills/lark-beautifier`。修改后同步到 `.claude`：

```bash
npm run sync:skills
npm run check:skills
```

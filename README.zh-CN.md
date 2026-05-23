# Lark Beautifier

[English README](README.md)

Lark Beautifier 是一个面向飞书 / Lark 文档的美化工具和可安装 Agent Skill。它可以把普通 Markdown 转成更适合飞书阅读的结构化 Markdown，也可以通过 `@larksuiteoapi/lark-mcp` OAuth 授权码流程 + 飞书 OpenAPI，以 dry-run 优先的方式写回真实飞书文档。

它的目标不是“重写内容”，而是在保留事实和语义的前提下改善阅读体验：中文排版、callout、grid、智能表格、白板提示，以及图表、流程图、配图、小红书卡片等视觉增强建议。

## 能力

- 清理中文排版，不破坏代码块、链接、图片 URL 和已有 Lark XML 块。
- 把高置信提示语转换为 callout。
- 把对比型小节转换为 grid 分栏。
- 把复杂表格转换为更适合飞书的表格标记。
- 为流程图、架构图、趋势图、白板、配图、小红书卡片生成建议。
- 提供 dry-run-first 的飞书 OpenAPI 写回脚本，默认不直接改真实文档。

## 安装为 Codex Skill

复制 skill 目录到 Codex skills 目录：

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

## 安装为 Claude Code Skill

Claude Code skill 同样使用 `SKILL.md` 作为入口。本仓库已经提供 Claude Code 版本：

```text
.claude/skills/lark-beautifier
```

项目级安装：

```bash
git clone https://github.com/wellingfeng/lark-beautifier.git
mkdir -p .claude/skills
cp -R lark-beautifier/.claude/skills/lark-beautifier .claude/skills/
```

个人级安装：

```bash
git clone https://github.com/wellingfeng/lark-beautifier.git
mkdir -p ~/.claude/skills
cp -R lark-beautifier/.claude/skills/lark-beautifier ~/.claude/skills/
```

Windows PowerShell 项目级安装：

```powershell
git clone https://github.com/wellingfeng/lark-beautifier.git
New-Item -ItemType Directory -Force .claude\skills
Copy-Item -Recurse lark-beautifier\.claude\skills\lark-beautifier .claude\skills\
```

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

## 三档模式

| 模式 | 适用场景 |
|---|---|
| `safe` | 高风险、高管、法务、财务类文档，只做保守排版和高置信 callout |
| `structured` | 默认模式，适合 PRD、会议纪要、技术方案、周报、复盘等飞书文档 |
| `bold` | 用户明确要求大胆优化或测试文档时使用，会生成 Mermaid / 图片卡片等草案 |

示例：

```bash
node dist/cli.js input.md \
  --output output.md \
  --mode structured \
  --callouts auto \
  --grids auto \
  --tables smart \
  --whiteboards suggest \
  --enhancements suggest
```

`bold` 模式可以生成更强的视觉草案，但写回真实飞书文档前应先让用户确认。

## 飞书写回

Skill 内置写回脚本，默认 dry-run，只生成计划，不修改文档。可以从本地 Markdown 生成写回计划：

```bash
node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input examples/beautified.md \
  --mode structured \
  --plan-output plan.json
```

确认计划后，再加 `--apply` 写回：

```bash
LARK_MCP_APP_ID=<app_id> node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input examples/beautified.md \
  --mode structured \
  --apply
```

也可以直接读取现有飞书文档，生成差异计划后再决定是否写回：

```bash
LARK_MCP_APP_ID=<app_id> node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --mode structured \
  --plan-output plan.json
```

如果使用 `--mode bold`，真实写回前必须在用户确认方案后额外传入 `--confirm-bold`。

首次登录建议使用 `@larksuiteoapi/lark-mcp` 的 OAuth 授权码流程：

```bash
npx -y @larksuiteoapi/lark-mcp login -a <app_id> -s <app_secret> -p 8765 --host 127.0.0.1
```

不要提交 app secret、user access token、refresh token 或本地 OAuth 存储文件。

## 目录说明

```text
skills/lark-beautifier              # Codex Skill
.claude/skills/lark-beautifier      # Claude Code Skill
src                                 # TypeScript CLI 源码
tests                               # 回归测试
examples                            # 输入与输出示例
```

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

## 安全约束

- 写回脚本默认 dry-run，只有显式 `--apply` 才会修改真实飞书文档。
- 不使用 `lark-cli auth login` 的设备码流程作为默认路径。
- 默认使用 `lark-mcp` OAuth 授权码流程。
- 不在日志、README、提交记录中输出 token 或 app secret。

# 项目计划

## 背景

这个工具用于把Markdown发到飞书docs。注意:不要改变原文事实,只做结构和排版优化。

## 方案对比

### 方案 A

- 快速落地
- 适合现有lark-cli流程

### 方案 B

- 需要更多集成
- 后续可生成真实画板

## 风险矩阵

| 风险 | 影响 | 负责人 | 缓解计划 |
|---|---|---|---|
| 飞书XML被转义 | 文档块不可用 | 平台组 | renderer最后输出,不再交给通用formatter |
| URL被插入空格 | 链接损坏 | 工具组 | AST层跳过link和inlineCode |

## 系统架构图

后续可把解析、分析、渲染流程画成whiteboard。

```ts
const url = "https://example.com/a?b=Markdown测试";
console.log(url);
```


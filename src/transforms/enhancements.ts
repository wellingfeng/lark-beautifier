import type { Heading, Root, RootContent } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { textContent } from "../analyzer.js";
import type { BeautifierRoot, LarkEnhancementNode } from "../types.js";
import type { SignalReport } from "../analyze/signals.js";

type EnhancementKind = LarkEnhancementNode["kind"];

interface EnhancementRule {
  kind: EnhancementKind;
  title: string;
  patterns: RegExp[];
  rationale: string;
  actions: string[];
  artifact: (heading: string, mode: BeautifierConfig["enhancements"]) => LarkEnhancementNode["artifact"];
}

const rules: EnhancementRule[] = [
  {
    kind: "diagram",
    title: "视觉增强建议：流程图",
    patterns: [/流程|路径|链路|步骤|审批|流转|SOP/i],
    rationale: "这个小节更适合用流程图呈现，读者可以先看全链路，再回到正文理解细节。",
    actions: [
      "先让用户确认是否允许把正文步骤重构为图示。",
      "确认后优先生成 Mermaid 或飞书画板；如果要写回飞书，再用 lark-whiteboard-cli 或 lark-whiteboard。"
    ],
    artifact: () => undefined
  },
  {
    kind: "diagram",
    title: "视觉增强建议：架构图",
    patterns: [/架构|依赖|拓扑|模块|系统|服务|组件|集成/i],
    rationale: "架构和依赖内容只靠段落很难扫读，适合补一张组件关系图或飞书画板。",
    actions: [
      "先确认是否允许根据正文抽取模块和关系。",
      "确认后生成组件图；不要凭空新增系统、服务或依赖。"
    ],
    artifact: () => undefined
  },
  {
    kind: "chart",
    title: "视觉增强建议：图表",
    patterns: [/指标|数据|增长|下降|占比|转化|成本|收益|趋势|对比|矩阵/i],
    rationale: "包含指标、趋势或对比时，图表比纯文本更利于判断重点和异常。",
    actions: [
      "先确认是否允许从正文或表格抽取数据。",
      "确认后再生成柱状图、折线图或对比表；缺失数据必须标注为待补充。"
    ],
    artifact: () => undefined
  },
  {
    kind: "image",
    title: "视觉增强建议：封面/配图",
    patterns: [/封面|配图|小红书|海报|活动|案例|故事|品牌|宣传/i],
    rationale: "面向传播或活动的内容可以加封面、段首图或小红书风格卡片，提高第一屏吸引力。",
    actions: [
      "先确认视觉风格、尺寸和是否可以生成或引用图片。",
      "确认后可使用 baoyu-xhs-images 生成小红书卡片，或用 imagegen 生成真实位图，再上传到飞书。"
    ],
    artifact: (_heading, mode) =>
      mode === "draft"
        ? {
            type: "prompt",
            value: "baoyu-xhs-images prompt: 提炼本文核心观点，生成 3 张小红书信息卡；风格清爽、标题短、每张不超过 3 个要点，保留事实边界。"
          }
        : undefined
  },
  {
    kind: "layout",
    title: "视觉增强建议：阅读版式",
    patterns: [/摘要|TL;DR|结论|行动项|负责人|排期|里程碑|路线图|复盘/i],
    rationale: "摘要、行动项和里程碑适合独立成卡片或时间线，能减少长文读者的定位成本。",
    actions: [
      "先确认是否允许移动段落顺序或新增摘要区。",
      "确认后再拆成概览卡、行动项表或时间线；默认只保留建议，不改正文结构。"
    ],
    artifact: () => undefined
  }
];

export function transformEnhancements(tree: Root, config: BeautifierConfig): void {
  if (config.enhancements === "off") {
    return;
  }

  const output: RootContent[] = [];
  const insertedKinds = new Set<EnhancementKind>();
  const report = (tree as BeautifierRoot).larkBeautifier?.analysis;
  const activeComponents = new Set(
    Array.isArray(config.components) ? config.components.map((name) => name.trim().toLowerCase()) : []
  );
  const componentsAuto = config.components === "auto";
  const sectionContexts = collectHeadingContexts(tree.children);

  for (const [index, node] of tree.children.entries()) {
    output.push(node);

    if (node.type !== "heading") {
      continue;
    }

    if ((node as Heading).depth <= 1) {
      continue;
    }

    const heading = textContent(node as Heading).trim();
    const context = sectionContexts.get(index);
    const rule = rules.find((candidate) => {
      if (insertedKinds.has(candidate.kind)) {
        return false;
      }
      if (!shouldSuggestForContext(candidate.kind, context)) {
        return false;
      }
      return candidate.patterns.some((pattern) => pattern.test(heading));
    });

    if (!rule) {
      continue;
    }

    insertedKinds.add(rule.kind);
    output.push(makeEnhancement(rule, heading, config) as unknown as RootContent);
  }

  appendAnalysisEnhancements(output, report, insertedKinds, config, activeComponents, componentsAuto);

  tree.children = output;
}

interface SectionContext {
  hasMermaid: boolean;
  hasImage: boolean;
  hasTable: boolean;
  hasList: boolean;
  hasNumericEvidence: boolean;
}

function collectHeadingContexts(children: RootContent[]): Map<number, SectionContext> {
  const contexts = new Map<number, SectionContext>();
  const headingStack: Array<{ index: number; depth: number }> = [];

  for (let index = 0; index < children.length; index += 1) {
    const node = children[index];
    if (node.type === "heading") {
      const depth = (node as Heading).depth;
      while (headingStack.length && headingStack[headingStack.length - 1].depth >= depth) {
        headingStack.pop();
      }
      headingStack.push({ index, depth });
      contexts.set(index, { hasMermaid: false, hasImage: false, hasTable: false, hasList: false, hasNumericEvidence: false });
      continue;
    }

    const current = headingStack[headingStack.length - 1];
    if (!current) continue;
    const context = contexts.get(current.index);
    if (!context) continue;

    if (node.type === "code" && typeof node.lang === "string" && node.lang.toLowerCase() === "mermaid") {
      context.hasMermaid = true;
    } else if (node.type === "image") {
      context.hasImage = true;
    } else if (node.type === "table") {
      context.hasTable = true;
    } else if (node.type === "list") {
      context.hasList = true;
    }
    if (hasNumericEvidence(textContent(node))) {
      context.hasNumericEvidence = true;
    }
  }

  return contexts;
}

function shouldSuggestForContext(kind: EnhancementKind, context: SectionContext | undefined): boolean {
  if (!context) return true;
  if (kind === "diagram" && context.hasMermaid) return false;
  if (kind === "chart" && (context.hasMermaid || !context.hasNumericEvidence)) return false;
  if (kind === "image" && context.hasImage) return false;
  if (kind === "layout" && (context.hasList || context.hasTable)) return false;
  return true;
}

function hasNumericEvidence(text: string): boolean {
  return /(?:\d+(?:\.\d+)?\s*(?:%|ms|s|秒|分钟|小时|天|GB|MB|KB|fps|FPS|x|倍|元|万|亿|K|M)|Q[1-4]|P\d|v?\d+\.\d+)/i.test(text);
}

function makeEnhancement(rule: EnhancementRule, heading: string, config: BeautifierConfig): LarkEnhancementNode {
  return {
    type: "larkEnhancement",
    kind: rule.kind,
    title: `${rule.title}（${heading}）`,
    rationale: rule.rationale,
    actions: rule.actions,
    artifact: rule.artifact(heading, config.enhancements)
  };
}

function appendAnalysisEnhancements(
  output: RootContent[],
  report: SignalReport | undefined,
  insertedKinds: Set<EnhancementKind>,
  config: BeautifierConfig,
  activeComponents: Set<string>,
  componentsAuto: boolean
): void {
  if (!report) return;

  if (!insertedKinds.has("chart") && report.components.kpiCardRow && !componentAlreadyApplied("kpi-card-row")) {
    insertedKinds.add("chart");
    output.push(makeAnalysisEnhancement({
      kind: "chart",
      title: "视觉增强建议：指标卡片",
      rationale: `检测到 ${report.components.kpiCardRow.items.length} 个并列指标，可升级为 kpi-card-row，比普通段落更容易扫读。`,
      actions: [
        "仅使用原文已有指标和值，不补充缺失口径。",
        "可先运行 --components kpi-card-row 预览组件化效果。"
      ],
      artifact: config.enhancements === "draft"
        ? {
            type: "prompt",
            value: report.components.kpiCardRow.items
              .map((item) => `${item.label}: ${item.value}`)
              .join("\n")
          }
        : undefined
    }) as unknown as RootContent);
  }

  if (!insertedKinds.has("layout") && report.components.timeline && !componentAlreadyApplied("timeline")) {
    insertedKinds.add("layout");
    output.push(makeAnalysisEnhancement({
      kind: "layout",
      title: "视觉增强建议：时间线",
      rationale: `检测到 ${report.components.timeline.phases.length} 个按时间或阶段排列的事项，适合转成 timeline 表格。`,
      actions: [
        "保持原文时间顺序，不推断日期。",
        "可先运行 --components timeline 预览三列表格版本。"
      ],
      artifact: config.enhancements === "draft"
        ? {
            type: "mermaid",
            value: [
              "timeline",
              "  title 时间线",
              ...report.components.timeline.phases.map((phase) => `  ${phase.when} : ${phase.what}`)
            ].join("\n")
          }
        : undefined
    }) as unknown as RootContent);
  }

  if (!insertedKinds.has("layout") && report.components.beforeAfter && !componentAlreadyApplied("before-after")) {
    insertedKinds.add("layout");
    output.push(makeAnalysisEnhancement({
      kind: "layout",
      title: "视觉增强建议：Before / After",
      rationale: `检测到「${report.components.beforeAfter.beforeHeading}」与「${report.components.beforeAfter.afterHeading}」这组前后对比，适合转成双栏 before-after。`,
      actions: [
        "左右两栏只承载原小节内容。",
        "如果任一侧内容超过 4 个块，保留普通章节比双栏更稳。"
      ]
    }) as unknown as RootContent);
  }

  function componentAlreadyApplied(component: string): boolean {
    return componentsAuto || activeComponents.has(component);
  }
}

function makeAnalysisEnhancement(input: {
  kind: EnhancementKind;
  title: string;
  rationale: string;
  actions: string[];
  artifact?: LarkEnhancementNode["artifact"];
}): LarkEnhancementNode {
  return {
    type: "larkEnhancement",
    kind: input.kind,
    title: input.title,
    rationale: input.rationale,
    actions: input.actions,
    artifact: input.artifact
  };
}

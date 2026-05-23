import type { Heading, Root, RootContent } from "mdast";
import type { BeautifierConfig } from "../config.js";
import { textContent } from "../analyzer.js";
import type { LarkEnhancementNode } from "../types.js";

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
    artifact: (heading, mode) =>
      mode === "draft"
        ? {
            type: "mermaid",
            value: `flowchart TD\n  A[开始：${heading}] --> B[关键步骤]\n  B --> C{是否满足条件}\n  C -- 是 --> D[进入下一阶段]\n  C -- 否 --> E[补充信息后重试]`
          }
        : undefined
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
    artifact: (heading, mode) =>
      mode === "draft"
        ? {
            type: "mermaid",
            value: `flowchart LR\n  U[用户/读者] --> A[${heading}]\n  A --> B[模块 A]\n  A --> C[模块 B]\n  B --> D[外部依赖]`
          }
        : undefined
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
    artifact: (heading, mode) =>
      mode === "draft"
        ? {
            type: "mermaid",
            value: `xychart-beta\n  title "${heading}"\n  x-axis ["A", "B", "C"]\n  y-axis "数值" 0 --> 100\n  bar [30, 55, 80]`
          }
        : undefined
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
    artifact: (heading, mode) =>
      mode === "draft"
        ? {
            type: "mermaid",
            value: `timeline\n  title ${heading}\n  阶段一 : 待从正文确认\n  阶段二 : 待从正文确认\n  阶段三 : 待从正文确认`
          }
        : undefined
  }
];

export function transformEnhancements(tree: Root, config: BeautifierConfig): void {
  if (config.enhancements === "off") {
    return;
  }

  const output: RootContent[] = [];
  const insertedKinds = new Set<EnhancementKind>();

  for (const node of tree.children) {
    output.push(node);

    if (node.type !== "heading") {
      continue;
    }

    const heading = textContent(node as Heading).trim();
    const rule = rules.find((candidate) => {
      if (insertedKinds.has(candidate.kind)) {
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

  tree.children = output;
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

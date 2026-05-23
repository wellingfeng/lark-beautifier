export type ThemeName = "technical-blue" | "warm-product" | "clean-minimal" | "vivid-marketing";

export type CalloutRole =
  | "tldr"
  | "info"
  | "success"
  | "risk"
  | "danger"
  | "experimental"
  | "platform"
  | "neutral"
  | "decision"
  | "action";

export interface CalloutStyle {
  emoji: string;
  backgroundColor: string;
  borderColor: string;
}

export interface ThemePreset {
  name: ThemeName;
  audience: string;
  defaultSectionEmoji: string;
  emojiByKeyword: Array<{ pattern: RegExp; emoji: string }>;
  callout: Record<CalloutRole, CalloutStyle>;
  keywordBag: string[];
  actionItemPalette: CalloutStyle[];
}

const sharedEmojiByKeyword: Array<{ pattern: RegExp; emoji: string }> = [
  { pattern: /(概述|overview|tl;?dr|摘要|要点)/i, emoji: "🎯" },
  { pattern: /(性能|perf|fps|latency|延迟|帧率)/i, emoji: "⚡" },
  { pattern: /(升级|migrat|迁移|兼容)/i, emoji: "⬆️" },
  { pattern: /(渲染|render|shader|光照|材质)/i, emoji: "🎨" },
  { pattern: /(工具链|toolchain|build|编译|链接器)/i, emoji: "🛠️" },
  { pattern: /(时间|路线图|roadmap|timeline|节奏|发布计划)/i, emoji: "📅" },
  { pattern: /(对比|before|after|改版|新旧)/i, emoji: "🔄" },
  { pattern: /(总结|结论|结语|小结)/i, emoji: "🏁" },
  { pattern: /(风险|警告|警示|注意)/i, emoji: "⚠️" },
  { pattern: /(新特性|新功能|feature|亮点)/i, emoji: "✨" },
  { pattern: /(用户|user|customer|访谈)/i, emoji: "👤" },
  { pattern: /(数据|metric|指标|kpi)/i, emoji: "📊" },
  { pattern: /(决策|decision|方案)/i, emoji: "📌" },
  { pattern: /(参考|reference|资料|延伸)/i, emoji: "📎" }
];

export const themes: Record<ThemeName, ThemePreset> = {
  "technical-blue": {
    name: "technical-blue",
    audience: "engineer",
    defaultSectionEmoji: "🔹",
    emojiByKeyword: sharedEmojiByKeyword,
    callout: {
      tldr: { emoji: "🎯", backgroundColor: "light-blue", borderColor: "blue" },
      info: { emoji: "💡", backgroundColor: "light-blue", borderColor: "blue" },
      success: { emoji: "✅", backgroundColor: "light-green", borderColor: "green" },
      risk: { emoji: "⚠️", backgroundColor: "light-yellow", borderColor: "yellow" },
      danger: { emoji: "🛑", backgroundColor: "light-red", borderColor: "red" },
      experimental: { emoji: "🧪", backgroundColor: "light-purple", borderColor: "purple" },
      platform: { emoji: "🥽", backgroundColor: "light-orange", borderColor: "orange" },
      neutral: { emoji: "📝", backgroundColor: "light-gray", borderColor: "gray" },
      decision: { emoji: "📌", backgroundColor: "light-blue", borderColor: "blue" },
      action: { emoji: "🛠️", backgroundColor: "light-green", borderColor: "green" }
    },
    keywordBag: [
      "sdk", "api", "release", "version", "build", "ci", "deploy", "mesh", "shader", "perf",
      "latency", "渲染", "编译", "引擎", "架构", "链接", "工具链", "调度", "回归", "稳定性"
    ],
    actionItemPalette: [
      { emoji: "🔍", backgroundColor: "light-blue", borderColor: "blue" },
      { emoji: "🛠️", backgroundColor: "light-green", borderColor: "green" },
      { emoji: "🔌", backgroundColor: "light-orange", borderColor: "orange" },
      { emoji: "🧪", backgroundColor: "light-purple", borderColor: "purple" }
    ]
  },
  "warm-product": {
    name: "warm-product",
    audience: "product, ops",
    defaultSectionEmoji: "🌟",
    emojiByKeyword: sharedEmojiByKeyword,
    callout: {
      tldr: { emoji: "🎯", backgroundColor: "light-orange", borderColor: "orange" },
      info: { emoji: "💡", backgroundColor: "light-yellow", borderColor: "yellow" },
      success: { emoji: "🎉", backgroundColor: "light-green", borderColor: "green" },
      risk: { emoji: "😣", backgroundColor: "light-red", borderColor: "red" },
      danger: { emoji: "🚨", backgroundColor: "light-red", borderColor: "red" },
      experimental: { emoji: "🧪", backgroundColor: "light-purple", borderColor: "purple" },
      platform: { emoji: "🚀", backgroundColor: "light-blue", borderColor: "blue" },
      neutral: { emoji: "📝", backgroundColor: "light-gray", borderColor: "gray" },
      decision: { emoji: "📌", backgroundColor: "light-orange", borderColor: "orange" },
      action: { emoji: "🚀", backgroundColor: "light-orange", borderColor: "orange" }
    },
    keywordBag: [
      "prd", "需求", "用户故事", "卖点", "价值主张", "上线", "用户", "运营", "迭代",
      "转化", "留存", "增长", "用户体验", "feature", "story"
    ],
    actionItemPalette: [
      { emoji: "🚀", backgroundColor: "light-orange", borderColor: "orange" },
      { emoji: "👤", backgroundColor: "light-purple", borderColor: "purple" },
      { emoji: "🎉", backgroundColor: "light-green", borderColor: "green" },
      { emoji: "💡", backgroundColor: "light-yellow", borderColor: "yellow" }
    ]
  },
  "clean-minimal": {
    name: "clean-minimal",
    audience: "executive, external",
    defaultSectionEmoji: "",
    emojiByKeyword: [],
    callout: {
      tldr: { emoji: "📌", backgroundColor: "light-gray", borderColor: "gray" },
      info: { emoji: "📎", backgroundColor: "light-gray", borderColor: "gray" },
      success: { emoji: "✅", backgroundColor: "light-green", borderColor: "green" },
      risk: { emoji: "⚠️", backgroundColor: "light-red", borderColor: "red" },
      danger: { emoji: "⚠️", backgroundColor: "light-red", borderColor: "red" },
      experimental: { emoji: "📎", backgroundColor: "light-gray", borderColor: "gray" },
      platform: { emoji: "📎", backgroundColor: "light-gray", borderColor: "gray" },
      neutral: { emoji: "📎", backgroundColor: "light-gray", borderColor: "gray" },
      decision: { emoji: "📌", backgroundColor: "light-gray", borderColor: "gray" },
      action: { emoji: "📌", backgroundColor: "light-gray", borderColor: "gray" }
    },
    keywordBag: [
      "战略", "董事会", "合规", "季度", "财年", "风控", "审计", "委员会", "kpi",
      "okr", "governance", "compliance", "quarter", "fiscal"
    ],
    actionItemPalette: [
      { emoji: "📌", backgroundColor: "light-gray", borderColor: "gray" },
      { emoji: "📌", backgroundColor: "light-gray", borderColor: "gray" },
      { emoji: "📌", backgroundColor: "light-gray", borderColor: "gray" },
      { emoji: "📌", backgroundColor: "light-gray", borderColor: "gray" }
    ]
  },
  "vivid-marketing": {
    name: "vivid-marketing",
    audience: "marketing, community, public",
    defaultSectionEmoji: "🔥",
    emojiByKeyword: sharedEmojiByKeyword,
    callout: {
      tldr: { emoji: "🔥", backgroundColor: "light-orange", borderColor: "orange" },
      info: { emoji: "🚀", backgroundColor: "light-blue", borderColor: "blue" },
      success: { emoji: "📈", backgroundColor: "light-green", borderColor: "green" },
      risk: { emoji: "⏰", backgroundColor: "light-red", borderColor: "red" },
      danger: { emoji: "🎁", backgroundColor: "light-red", borderColor: "red" },
      experimental: { emoji: "📖", backgroundColor: "light-purple", borderColor: "purple" },
      platform: { emoji: "⭐", backgroundColor: "light-yellow", borderColor: "yellow" },
      neutral: { emoji: "📝", backgroundColor: "light-gray", borderColor: "gray" },
      decision: { emoji: "🚀", backgroundColor: "light-purple", borderColor: "purple" },
      action: { emoji: "🎁", backgroundColor: "light-red", borderColor: "red" }
    },
    keywordBag: [
      "限时", "福利", "活动", "上新", "抽奖", "直播", "首发", "爆款", "粉丝",
      "campaign", "promo", "launch", "trending", "viral"
    ],
    actionItemPalette: [
      { emoji: "🎁", backgroundColor: "light-red", borderColor: "red" },
      { emoji: "🔥", backgroundColor: "light-orange", borderColor: "orange" },
      { emoji: "⭐", backgroundColor: "light-yellow", borderColor: "yellow" },
      { emoji: "🚀", backgroundColor: "light-purple", borderColor: "purple" }
    ]
  }
};

export const defaultTheme: ThemeName = "technical-blue";

export function resolveThemeName(name: ThemeName | "auto" | undefined, scores: Record<ThemeName, number>): ThemeName {
  if (name && name !== "auto") {
    return name;
  }
  let best: ThemeName = defaultTheme;
  let bestScore = 0;
  for (const candidate of Object.keys(scores) as ThemeName[]) {
    if (scores[candidate] > bestScore) {
      bestScore = scores[candidate];
      best = candidate;
    }
  }
  return bestScore >= 3 ? best : defaultTheme;
}

export function pickSectionEmoji(theme: ThemePreset, headingText: string): string {
  for (const { pattern, emoji } of theme.emojiByKeyword) {
    if (pattern.test(headingText)) {
      return emoji;
    }
  }
  return theme.defaultSectionEmoji;
}

export type ToggleMode = "off" | "auto" | "conservative";
export type TableMode = "markdown" | "smart" | "lark";
export type WhiteboardMode = "off" | "suggest" | "insert-blank";
export type EnhancementMode = "off" | "suggest" | "draft";
export type BeautifierMode = "safe" | "structured" | "bold";

export interface BeautifierConfig {
  mode?: BeautifierMode;
  profile: "lark";
  language: "zh-CN";
  callouts: ToggleMode;
  grids: ToggleMode;
  tables: TableMode;
  whiteboards: WhiteboardMode;
  enhancements: EnhancementMode;
  conservative: boolean;
}

export const defaultConfig: BeautifierConfig = {
  profile: "lark",
  language: "zh-CN",
  callouts: "auto",
  grids: "auto",
  tables: "smart",
  whiteboards: "suggest",
  enhancements: "off",
  conservative: false
};

const modeDefaults: Record<BeautifierMode, Partial<BeautifierConfig>> = {
  safe: {
    callouts: "conservative",
    grids: "off",
    tables: "markdown",
    whiteboards: "off",
    enhancements: "off",
    conservative: true
  },
  structured: {
    callouts: "auto",
    grids: "auto",
    tables: "smart",
    whiteboards: "suggest",
    enhancements: "suggest",
    conservative: false
  },
  bold: {
    callouts: "auto",
    grids: "auto",
    tables: "lark",
    whiteboards: "suggest",
    enhancements: "draft",
    conservative: false
  }
};

export function normalizeConfig(options: Partial<BeautifierConfig>): BeautifierConfig {
  const config = { ...defaultConfig, ...(options.mode ? modeDefaults[options.mode] : {}), ...options };

  if (config.conservative) {
    config.callouts = config.callouts === "auto" ? "conservative" : config.callouts;
    config.grids = config.grids === "auto" ? "conservative" : config.grids;
    config.enhancements = config.enhancements === "draft" ? "suggest" : config.enhancements;
  }

  return config;
}

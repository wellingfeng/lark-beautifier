import type { ThemeName } from "./themes.js";

export type ToggleMode = "off" | "auto" | "conservative";
export type TableMode = "markdown" | "smart" | "lark";
export type WhiteboardMode = "off" | "suggest" | "insert-blank";
export type EnhancementMode = "off" | "suggest" | "draft";
export type BeautifierMode = "safe" | "structured" | "bold";
export type ThemeOption = ThemeName | "auto";
export type ComponentsOption = "off" | "auto" | string[];
export type VisualDensity = "minimal" | "balanced" | "rich";

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
  theme: ThemeOption;
  components: ComponentsOption;
  visualDensity: VisualDensity;
}

export const defaultConfig: BeautifierConfig = {
  profile: "lark",
  language: "zh-CN",
  callouts: "auto",
  grids: "auto",
  tables: "smart",
  whiteboards: "suggest",
  enhancements: "off",
  conservative: false,
  theme: "auto",
  components: "off",
  visualDensity: "balanced"
};

const modeDefaults: Record<BeautifierMode, Partial<BeautifierConfig>> = {
  safe: {
    callouts: "conservative",
    grids: "off",
    tables: "markdown",
    whiteboards: "off",
    enhancements: "off",
    conservative: true,
    components: "off",
    visualDensity: "minimal"
  },
  structured: {
    callouts: "auto",
    grids: "auto",
    tables: "smart",
    whiteboards: "suggest",
    enhancements: "suggest",
    conservative: false,
    components: "off",
    visualDensity: "balanced"
  },
  bold: {
    callouts: "auto",
    grids: "auto",
    tables: "lark",
    whiteboards: "suggest",
    enhancements: "suggest",
    conservative: false,
    components: "off",
    visualDensity: "rich"
  }
};

export function normalizeConfig(options: Partial<BeautifierConfig>): BeautifierConfig {
  const config = { ...defaultConfig, ...(options.mode ? modeDefaults[options.mode] : {}), ...options };

  if (config.conservative) {
    config.callouts = config.callouts === "auto" ? "conservative" : config.callouts;
    config.grids = config.grids === "auto" ? "conservative" : config.grids;
    config.enhancements = config.enhancements === "draft" ? "suggest" : config.enhancements;
    config.visualDensity = config.visualDensity === "rich" ? "balanced" : config.visualDensity;
  }

  return config;
}

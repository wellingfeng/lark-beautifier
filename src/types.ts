import type { Root } from "mdast";
import type { SignalReport } from "./analyze/signals.js";

export type BeautifierRoot = Root & {
  larkBeautifier?: {
    frontmatter?: string;
    analysis?: SignalReport;
  };
};

export type LarkNode =
  | LarkCalloutNode
  | LarkGridNode
  | LarkTableNode
  | LarkWhiteboardNode
  | LarkEnhancementNode;

export interface LarkCalloutNode {
  type: "larkCallout";
  emoji: string;
  backgroundColor: string;
  borderColor: string;
  children: Root["children"];
}

export interface LarkGridNode {
  type: "larkGrid";
  cols?: number;
  columns: Array<{
    title: string;
    children: Root["children"];
  }>;
}

export interface LarkTableNode {
  type: "larkTable";
  headers: Root["children"][number][][];
  rows: Root["children"][number][][][];
  columnWidths?: number[];
}

export interface LarkWhiteboardNode {
  type: "larkWhiteboard";
  boardType: "blank";
  title?: string;
}

export interface LarkEnhancementNode {
  type: "larkEnhancement";
  title: string;
  kind: "diagram" | "chart" | "image" | "layout";
  rationale: string;
  actions: string[];
  artifact?: {
    type: "mermaid" | "prompt" | "command";
    value: string;
  };
}

export type LarkBlock = Root["children"][number] | LarkNode;

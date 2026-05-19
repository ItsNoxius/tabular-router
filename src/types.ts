import type { Component } from "solid-js";

export interface TabularRoute {
  path: string;
  component: Component;
}

export interface ParsedLocation {
  pathname: string;
  search: Record<string, string>;
  href: string;
  query: Record<string, string>;
}

export interface HistoryEntry {
  id: string;
  pathname: string;
  search: Record<string, string>;
  params: Record<string, string>;
  /** Per-entry UI / draft state */
  state: Record<string, unknown>;
  /** Custom tab label (like `document.title`); falls back to route default */
  documentTitle?: string;
}

export interface TabWindowState {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  meta: Record<string, unknown>;
}

export interface Tab {
  id: string;
  title: string;
  history: HistoryEntry[];
  historyIndex: number;
  /** entry ids that have been mounted (keep-alive) */
  mountedEntryIds: string[];
  windows: TabWindowState[];
  nextZIndex: number;
}

/** Snapshot pushed when a tab closes (for reopen). */
export interface ClosedTabSnapshot {
  title: string;
  history: HistoryEntry[];
  historyIndex: number;
  mountedEntryIds: string[];
  windows: TabWindowState[];
  nextZIndex: number;
}

export interface RouterInitOptions {
  maxTabs?: number;
  /** Fallback when a path does not match any route. Falls back to `initialPath` or the first route. */
  rootPath?: string;
}

export interface TabularRouterState {
  tabs: Tab[];
  activeTabId: string;
  routes: TabularRoute[];
}

export interface NavigateOptions {
  replace?: boolean;
}

export type NavigateTarget = string | number;

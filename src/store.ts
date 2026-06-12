import { createStore, produce } from "solid-js/store";
import { createSignal } from "solid-js";
import { cloneForStorage } from "./clone";
import { buildHref, getRootPath, matchRoute, parseHref, resolveHref, setRootPath } from "./match";
import type {
  ClosedTabSnapshot,
  HistoryEntry,
  NavigateOptions,
  NavigateTarget,
  RouterInitOptions,
  Tab,
  TabularRoute,
  TabularRouterState,
  TabWindowState,
} from "./types";

export const DEFAULT_MAX_TABS = 20;
const MAX_CLOSED_TAB_STACK = 25;

let maxTabs = DEFAULT_MAX_TABS;
const closedTabStack: ClosedTabSnapshot[] = [];

let nextTabId = 1;
let nextEntryId = 1;

function createEntry(
  routes: TabularRoute[],
  href: string | undefined,
  state?: Record<string, unknown>,
): HistoryEntry {
  const resolved = resolveHref(routes, href);
  const { pathname, search } = parseHref(resolved);
  const match = matchRoute(routes, pathname);
  return {
    id: `entry-${nextEntryId++}`,
    pathname,
    search,
    params: match?.params ?? {},
    state: state ? { ...state } : {},
  };
}

function createTab(routes: TabularRoute[], initialHref?: string): Tab {
  const entry = createEntry(routes, initialHref);
  return {
    id: `tab-${nextTabId++}`,
    title: resolveEntryTitle(entry),
    history: [entry],
    historyIndex: 0,
    windows: [],
    nextZIndex: 100,
  };
}

const [routerState, setRouterState] = createStore<TabularRouterState>({
  tabs: [],
  activeTabId: "",
  routes: [],
});

function getActiveTab(): Tab | undefined {
  return routerState.tabs.find((t) => t.id === routerState.activeTabId);
}

function getActiveEntry(tab: Tab | undefined): HistoryEntry | undefined {
  if (!tab) return undefined;
  return tab.history[tab.historyIndex];
}

/** Tab label from the history entry; pages set this via `useDocumentTitle`. */
export function resolveEntryTitle(entry: HistoryEntry): string {
  return entry.documentTitle?.trim() ?? "";
}

function updateTabTitle(tabId: string, entry: HistoryEntry) {
  const idx = routerState.tabs.findIndex((t) => t.id === tabId);
  if (idx >= 0) {
    setRouterState("tabs", idx, "title", resolveEntryTitle(entry));
  }
}

export function setDocumentTitleForEntry(entryId: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;

  for (let tabIndex = 0; tabIndex < routerState.tabs.length; tabIndex++) {
    const tab = routerState.tabs[tabIndex];
    const entryIndex = tab.history.findIndex((e) => e.id === entryId);
    if (entryIndex < 0) continue;

    setRouterState("tabs", tabIndex, "history", entryIndex, "documentTitle", trimmed);
    if (tab.historyIndex === entryIndex) {
      setRouterState("tabs", tabIndex, "title", trimmed);
    }
    return;
  }
}

/** Set the active tab's title (browser `document.title` equivalent). */
export function setDocumentTitle(title: string) {
  const tabIndex = routerState.tabs.findIndex((t) => t.id === routerState.activeTabId);
  if (tabIndex < 0) return;
  const entry = routerState.tabs[tabIndex].history[routerState.tabs[tabIndex].historyIndex];
  if (!entry) return;
  setDocumentTitleForEntry(entry.id, title);
}

let routerInitialized = false;

export function getMaxTabs() {
  return maxTabs;
}

export function canGoBack(): boolean {
  const tab = getActiveTab();
  return (tab?.historyIndex ?? 0) > 0;
}

export function canGoForward(): boolean {
  const tab = getActiveTab();
  if (!tab) return false;
  return tab.historyIndex < tab.history.length - 1;
}

export function canOpenTab() {
  return routerState.tabs.length < maxTabs;
}

function snapshotHistoryEntry(entry: HistoryEntry): HistoryEntry {
  return {
    id: entry.id,
    pathname: entry.pathname,
    search: { ...entry.search },
    params: { ...entry.params },
    documentTitle: entry.documentTitle,
    state: cloneForStorage(entry.state ?? {}),
  };
}

function snapshotWindow(window: TabWindowState): TabWindowState {
  return {
    id: window.id,
    type: window.type,
    title: window.title,
    x: window.x,
    y: window.y,
    width: window.width,
    height: window.height,
    zIndex: window.zIndex,
    meta: cloneForStorage(window.meta ?? {}),
  };
}

function snapshotTab(tab: Tab): ClosedTabSnapshot {
  const history = Array.from(tab.history as HistoryEntry[]).map(snapshotHistoryEntry);
  const windows = Array.from(tab.windows as TabWindowState[]).map(snapshotWindow);
  return {
    title: tab.title,
    history,
    historyIndex: tab.historyIndex,
    windows,
    nextZIndex: tab.nextZIndex,
  };
}

function restoreTab(snapshot: ClosedTabSnapshot): Tab {
  return {
    id: `tab-${nextTabId++}`,
    title: snapshot.title,
    history: snapshot.history.map((entry) => ({
      ...snapshotHistoryEntry(entry),
    })),
    historyIndex: snapshot.historyIndex,
    windows: snapshot.windows.map((w) => snapshotWindow(w)),
    nextZIndex: snapshot.nextZIndex,
  };
}

function pushClosedTab(tab: Tab) {
  closedTabStack.push(snapshotTab(tab));
  if (closedTabStack.length > MAX_CLOSED_TAB_STACK) {
    closedTabStack.shift();
  }
}

export function reopenClosedTab(): boolean {
  if (!canOpenTab()) return false;
  const snapshot = closedTabStack.pop();
  if (!snapshot) return false;
  const tab = restoreTab(snapshot);
  setRouterState("tabs", (tabs) => [...tabs, tab]);
  setRouterState("activeTabId", tab.id);
  return true;
}

function cloneSnapshotAsNewTab(snapshot: ClosedTabSnapshot): Tab {
  const entryIdMap = new Map<string, string>();
  const history = snapshot.history.map((entry) => {
    const newId = `entry-${nextEntryId++}`;
    entryIdMap.set(entry.id, newId);
    return { ...snapshotHistoryEntry(entry), id: newId };
  });
  const tabNum = nextTabId;
  const windows = snapshot.windows.map((w, i) => ({
    ...snapshotWindow(w),
    id: `window-${tabNum}-dup-${i}`,
  }));
  return {
    id: `tab-${nextTabId++}`,
    title: snapshot.title,
    history,
    historyIndex: snapshot.historyIndex,
    windows,
    nextZIndex: snapshot.nextZIndex,
  };
}

/** Duplicate a tab (history, state, windows). Returns false at tab limit. */
export function duplicateTab(tabId?: string): boolean {
  if (!canOpenTab()) return false;
  const source = tabId != null ? routerState.tabs.find((t) => t.id === tabId) : getActiveTab();
  if (!source) return false;
  const tab = cloneSnapshotAsNewTab(snapshotTab(source));
  setRouterState("tabs", (tabs) => [...tabs, tab]);
  setRouterState("activeTabId", tab.id);
  return true;
}

export function duplicateActiveTab(): boolean {
  return duplicateTab();
}

export function initRouter(
  routes: TabularRoute[],
  initialPath?: string,
  options?: RouterInitOptions,
) {
  if (routes.length === 0) {
    return;
  }
  const resolvedRoot = options?.rootPath?.trim() || initialPath?.trim() || routes[0]?.path || "/";
  setRootPath(resolvedRoot);

  if (options?.maxTabs != null) {
    maxTabs = Math.max(1, options.maxTabs);
  }
  if (routerInitialized && routerState.tabs.length > 0) {
    setRouterState("routes", routes);
    return;
  }
  routerInitialized = true;
  closedTabStack.length = 0;
  const tab = createTab(routes, initialPath?.trim() || resolvedRoot);
  setRouterState({
    routes,
    tabs: [tab],
    activeTabId: tab.id,
  });
}

/** Go back one step in the active tab's history. */
export function navigateBackwards() {
  navigate(-1);
}

/** Go forward one step in the active tab's history. */
export function navigateForward() {
  navigate(1);
}

export function navigate(target: NavigateTarget, options?: NavigateOptions) {
  const tabIndex = routerState.tabs.findIndex((t) => t.id === routerState.activeTabId);
  if (tabIndex < 0) return;

  if (typeof target === "number") {
    const tab = routerState.tabs[tabIndex];
    const nextIndex = tab.historyIndex + target;
    if (nextIndex < 0 || nextIndex >= tab.history.length) return;
    setRouterState("tabs", tabIndex, "historyIndex", nextIndex);
    const entry = tab.history[nextIndex];
    updateTabTitle(tab.id, entry);
    notifyEntryState();
    return;
  }

  const entry = createEntry(routerState.routes, target);

  if (options?.replace) {
    setRouterState(
      produce((s) => {
        const t = s.tabs[tabIndex];
        t.history[t.historyIndex] = entry;
        t.title = resolveEntryTitle(entry);
      }),
    );
    notifyEntryState();
    return;
  }

  setRouterState(
    produce((s) => {
      const t = s.tabs[tabIndex];
      const truncated = t.history.slice(0, t.historyIndex + 1);
      truncated.push(entry);
      t.history = truncated;
      t.historyIndex = truncated.length - 1;
      t.title = resolveEntryTitle(entry);
    }),
  );
  notifyEntryState();
}

export function openTab(href?: string): boolean {
  if (!canOpenTab()) return false;
  const tab = createTab(routerState.routes, href);
  setRouterState("tabs", (tabs) => [...tabs, tab]);
  setRouterState("activeTabId", tab.id);
  return true;
}

export function closeTab(tabId: string) {
  const idx = routerState.tabs.findIndex((t) => t.id === tabId);
  if (idx < 0) return;

  const closing = routerState.tabs[idx];
  pushClosedTab(closing);

  const remaining = routerState.tabs.filter((t) => t.id !== tabId);
  if (remaining.length === 0) {
    const tab = createTab(routerState.routes, getRootPath());
    setRouterState({ tabs: [tab], activeTabId: tab.id });
    return;
  }

  setRouterState("tabs", remaining);

  if (routerState.activeTabId === tabId) {
    const next = remaining[Math.min(idx, remaining.length - 1)];
    setRouterState("activeTabId", next.id);
  }
}

export function closeActiveTab() {
  const tab = getActiveTab();
  if (tab) closeTab(tab.id);
}

export function activateTab(tabId: string) {
  if (routerState.tabs.some((t) => t.id === tabId)) {
    setRouterState("activeTabId", tabId);
  }
}

/** Activate tab by position (0-based). Returns false if index is out of range. */
export function activateTabAtIndex(index: number): boolean {
  const tab = routerState.tabs[index];
  if (!tab) return false;
  setRouterState("activeTabId", tab.id);
  return true;
}

export function getActiveTabId() {
  return routerState.activeTabId;
}

export function setSearchParams(
  patch: Record<string, string | undefined>,
  options?: NavigateOptions,
) {
  const tab = getActiveTab();
  const entry = getActiveEntry(tab);
  if (!tab || !entry) return;

  const tabIndex = routerState.tabs.findIndex((t) => t.id === tab.id);
  const nextSearch = { ...entry.search };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") {
      delete nextSearch[key];
    } else {
      nextSearch[key] = value;
    }
  }

  const href = buildHref(entry.pathname, nextSearch);
  if (options?.replace) {
    setRouterState("tabs", tabIndex, "history", tab.historyIndex, "search", nextSearch);
    return;
  }

  const newEntry = createEntry(routerState.routes, href, entry.state);
  setRouterState(
    produce((s) => {
      const t = s.tabs[tabIndex];
      const truncated = t.history.slice(0, t.historyIndex + 1);
      truncated.push(newEntry);
      t.history = truncated;
      t.historyIndex = truncated.length - 1;
    }),
  );
}

/** Bump reactive readers after mutating entry.state in place */
const [entryStateVersion, setEntryStateVersion] = createSignal(0);
const entryStateListeners = new Set<() => void>();

export function subscribeEntryState(listener: () => void) {
  entryStateListeners.add(listener);
  return () => entryStateListeners.delete(listener);
}

export function notifyEntryState() {
  setEntryStateVersion((version) => version + 1);
  entryStateListeners.forEach((l) => l());
}

export function getEntryStateVersion() {
  return entryStateVersion();
}

export { createEntry, getActiveEntry, getActiveTab, routerState, setRouterState };

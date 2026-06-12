import { createMemo } from "solid-js";
import { produce } from "solid-js/store";
import { useTabular } from "./context";
import { routerState, setRouterState, getEntryStateVersion } from "./store";
import type { HistoryEntry } from "./types";

export function findEntryInTabs(entryId: string): { tabIndex: number; entryIndex: number } | null {
  for (let tabIndex = 0; tabIndex < routerState.tabs.length; tabIndex++) {
    const entryIndex = routerState.tabs[tabIndex].history.findIndex((e) => e.id === entryId);
    if (entryIndex >= 0) return { tabIndex, entryIndex };
  }
  return null;
}

function readEntryState(entry: HistoryEntry): Record<string, unknown> | undefined {
  const loc = findEntryInTabs(entry.id);
  if (loc) {
    const state = routerState.tabs[loc.tabIndex].history[loc.entryIndex].state;
    return state && typeof state === "object" ? state : undefined;
  }
  return entry.state && typeof entry.state === "object" ? entry.state : undefined;
}

export function setEntryStatePath(entry: HistoryEntry, path: string[], value: unknown): void {
  const loc = findEntryInTabs(entry.id);
  if (loc) {
    const { tabIndex, entryIndex } = loc;
    setRouterState(
      produce((state) => {
        const historyEntry = state.tabs[tabIndex].history[entryIndex];
        if (!historyEntry.state || typeof historyEntry.state !== "object") {
          historyEntry.state = {};
        }
        let cursor = historyEntry.state as Record<string, unknown>;
        for (let i = 0; i < path.length - 1; i++) {
          const segment = path[i];
          let next = cursor[segment];
          if (!next || typeof next !== "object") {
            next = {};
            cursor[segment] = next;
          }
          cursor = next as Record<string, unknown>;
        }
        cursor[path[path.length - 1]] = value;
      }),
    );
    return;
  }

  // Entry not yet committed to the tab store (e.g. during creation)
  if (!entry.state || typeof entry.state !== "object") {
    entry.state = {};
  }
  let cursor = entry.state as Record<string, unknown>;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    let next = cursor[segment];
    if (!next || typeof next !== "object") {
      next = {};
      cursor[segment] = next;
    }
    cursor = next as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
}

export function getEntryRouteKey<T>(entry: HistoryEntry, key: string): T | undefined {
  const state = readEntryState(entry);
  const route = state?.__route__;
  if (!route || typeof route !== "object") return undefined;
  return (route as Record<string, unknown>)[key] as T | undefined;
}

export function setEntryRouteKey(entry: HistoryEntry, key: string, value: unknown): void {
  setEntryStatePath(entry, ["__route__", key], value);
}

export function getEntryScrollPosition(
  entryId: string,
  key = "default",
): { top: number; left: number } | null {
  const loc = findEntryInTabs(entryId);
  if (!loc) return null;
  const entry = routerState.tabs[loc.tabIndex].history[loc.entryIndex];
  const buckets = readEntryState(entry)?.__scroll__;
  if (!buckets || typeof buckets !== "object") return null;
  const scroll = (buckets as Record<string, unknown>)[key];
  if (!scroll || typeof scroll !== "object") return null;
  const { top, left } = scroll as { top?: number; left?: number };
  return { top: top ?? 0, left: left ?? 0 };
}

export function setEntryScrollPosition(
  entryId: string,
  position: { top: number; left: number },
  key = "default",
): void {
  const loc = findEntryInTabs(entryId);
  if (!loc) return;
  const entry = routerState.tabs[loc.tabIndex].history[loc.entryIndex];
  setEntryStatePath(entry, ["__scroll__", key], position);
}

/** Read/write namespaced state on the active history entry */
export function getEntryNamespace(
  entry: HistoryEntry | undefined,
  namespace: string,
): Record<string, unknown> {
  if (!entry) return {};

  const loc = findEntryInTabs(entry.id);
  if (loc) {
    const state = routerState.tabs[loc.tabIndex].history[loc.entryIndex].state;
    if (!state || typeof state !== "object") {
      return {};
    }
    const bag = state[namespace];
    if (!bag || typeof bag !== "object") {
      return {};
    }
    return bag as Record<string, unknown>;
  }

  const current = entry.state?.[namespace];
  if (!current || typeof current !== "object") {
    return {};
  }
  return current as Record<string, unknown>;
}

export function useEntryNamespace(namespace: string) {
  const router = useTabular();
  return createMemo(() => {
    getEntryStateVersion();
    const entry = router.activeEntry();
    return getEntryNamespace(entry, namespace);
  });
}

export function useRouteState<T extends Record<string, unknown>>(
  key: string,
  initial: T | (() => T),
): [() => T, (patch: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const router = useTabular();
  const init = typeof initial === "function" ? (initial as () => T)() : initial;

  const get = (): T => {
    getEntryStateVersion();
    const entry = router.activeEntry();
    if (!entry) return init;
    const stored = getEntryRouteKey<T>(entry, key);
    return stored !== undefined ? stored : init;
  };

  const set = (patch: Partial<T> | ((prev: T) => Partial<T>)) => {
    const entry = router.activeEntry();
    if (!entry) return;
    const current = get();
    const next =
      typeof patch === "function"
        ? { ...current, ...(patch as (prev: T) => Partial<T>)(current) }
        : { ...current, ...patch };
    setEntryRouteKey(entry, key, next);
    router.notifyEntryState();
  };

  return [get, set];
}

import { createContext, createEffect, createMemo, useContext, type Accessor } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { useTabular } from "./context";
import { matchRoute } from "./match";
import { routerState, setDocumentTitleForEntry } from "./store";
import type { HistoryEntry, NavigateOptions, ParsedLocation } from "./types";

export interface EntryContextValue {
  entry: HistoryEntry;
  tabId: string;
  isActive: boolean;
}

const EntryContext = createContext<EntryContextValue>();

export function useEntryContext(): EntryContextValue | undefined {
  return useContext(EntryContext);
}

export { EntryContext };

function resolveEntry(): HistoryEntry | undefined {
  const entryCtx = useContext(EntryContext);
  if (entryCtx) return entryCtx.entry;
  const router = useTabular();
  return router.activeEntry();
}

export interface UseNavigateResult {
  navigate: (target: string | number, options?: NavigateOptions) => void;
  navigateBackwards: () => void;
  navigateForward: () => void;
  canGoBack: Accessor<boolean>;
  canGoForward: Accessor<boolean>;
}

export function useNavigate(): UseNavigateResult {
  const router = useTabular();
  return {
    navigate: router.navigate,
    navigateBackwards: router.navigateBackwards,
    navigateForward: router.navigateForward,
    canGoBack: router.canGoBack,
    canGoForward: router.canGoForward,
  };
}

export function useLocation(): Accessor<ParsedLocation> {
  const router = useTabular();
  return createMemo((): ParsedLocation => {
    const entry = resolveEntry();
    if (!entry) return router.location();
    const search = entry.search;
    const qs = Object.keys(search).length ? `?${new URLSearchParams(search).toString()}` : "";
    return {
      pathname: entry.pathname,
      search,
      query: search,
      href: `${entry.pathname}${qs}`,
    };
  });
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const params = createMemo(() => {
    const entry = resolveEntry();
    return (entry?.params ?? {}) as T;
  });
  return new Proxy({} as T, {
    get(_, prop: string) {
      return params()[prop as keyof T];
    },
    has(_, prop) {
      return prop in params();
    },
    ownKeys() {
      return Reflect.ownKeys(params());
    },
    getOwnPropertyDescriptor(_, prop) {
      return {
        enumerable: true,
        configurable: true,
        value: params()[prop as keyof T],
      };
    },
  });
}

export function useSearchParams<
  T extends Record<string, string | undefined> = Record<string, string>,
>(): [T, (patch: Partial<T>, options?: NavigateOptions) => void] {
  const router = useTabular();
  const [searchParams, setSearchParamsStore] = createStore<T>({} as T);

  createEffect(() => {
    const entry = resolveEntry();
    const search = (entry?.search ?? router.location().search) as T;
    setSearchParamsStore(reconcile(search as T));
  });

  const setParams = (patch: Partial<T>, options?: NavigateOptions) => {
    router.setSearchParams(patch as Record<string, string | undefined>, options);
  };

  return [
    new Proxy({} as T, {
      get(_, prop: string) {
        return searchParams[prop as keyof T];
      },
    }),
    setParams,
  ];
}

/**
 * Set the tab title for the current history entry (like `document.title`).
 * Re-runs when `title` changes; restored on back/forward via per-entry storage.
 */
export function useDocumentTitle(title: string | Accessor<string>) {
  const entryCtx = useEntryContext();
  const router = useTabular();

  createEffect(() => {
    const value = typeof title === "function" ? title() : title;
    if (!value.trim()) return;
    const entry = entryCtx?.entry ?? router.activeEntry();
    if (!entry) return;
    setDocumentTitleForEntry(entry.id, value);
  });
}

export function useTabs() {
  const router = useTabular();
  return {
    tabs: router.tabs,
    activeTabId: createMemo(() => router.activeTab()?.id ?? ""),
    openTab: router.openTab,
    closeTab: router.closeTab,
    reopenClosedTab: router.reopenClosedTab,
    duplicateTab: router.duplicateTab,
    canOpenTab: router.canOpenTab,
    getMaxTabs: router.getMaxTabs,
    activateTab: router.activateTab,
    activateTabAtIndex: router.activateTabAtIndex,
    canGoBack: router.canGoBack,
    canGoForward: router.canGoForward,
    navigateBackwards: router.navigateBackwards,
    navigateForward: router.navigateForward,
  };
}

export function useMatchRoute() {
  return createMemo(() => {
    const entry = resolveEntry();
    if (!entry) return null;
    return matchRoute(routerState.routes, entry.pathname);
  });
}

export { useEntryNamespace, useRouteState } from "./entry-state";

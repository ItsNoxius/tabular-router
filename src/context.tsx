import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import { buildHref } from "./match";
import {
  activateTab,
  activateTabAtIndex,
  canOpenTab,
  closeTab,
  duplicateTab,
  getActiveEntry,
  getActiveTab,
  getEntryStateVersion,
  getMaxTabs,
  navigate,
  navigateBackwards,
  navigateForward,
  notifyEntryState,
  openTab,
  reopenClosedTab,
  routerState,
  setDocumentTitle,
  setSearchParams,
  subscribeEntryState,
} from "./store";
import type { HistoryEntry, ParsedLocation, Tab } from "./types";

export interface TabularContextValue {
  activeTab: Accessor<Tab | undefined>;
  activeEntry: Accessor<HistoryEntry | undefined>;
  location: Accessor<ParsedLocation>;
  tabs: Accessor<Tab[]>;
  navigate: typeof navigate;
  navigateBackwards: typeof navigateBackwards;
  navigateForward: typeof navigateForward;
  canGoBack: Accessor<boolean>;
  canGoForward: Accessor<boolean>;
  openTab: typeof openTab;
  closeTab: typeof closeTab;
  reopenClosedTab: typeof reopenClosedTab;
  duplicateTab: typeof duplicateTab;
  canOpenTab: typeof canOpenTab;
  getMaxTabs: typeof getMaxTabs;
  activateTab: typeof activateTab;
  activateTabAtIndex: typeof activateTabAtIndex;
  setSearchParams: typeof setSearchParams;
  setDocumentTitle: typeof setDocumentTitle;
  notifyEntryState: typeof notifyEntryState;
}

const TabularContext = createContext<TabularContextValue>();

export function useTabular(): TabularContextValue {
  const ctx = useContext(TabularContext);
  if (!ctx) {
    throw new Error("useTabular must be used within Router");
  }
  return ctx;
}

export function TabularProvider(props: ParentProps) {
  const [entryTick, setEntryTick] = createSignal(0);

  onCleanup(
    subscribeEntryState(() => {
      setEntryTick((v) => v + 1);
    }),
  );

  const activeTab = createMemo(() => {
    entryTick();
    const tab = getActiveTab();
    if (tab) {
      void [tab.historyIndex, tab.history.length];
    }
    return tab;
  });
  const activeEntry = createMemo(() => {
    entryTick();
    getEntryStateVersion();
    return getActiveEntry(activeTab());
  });

  const location = createMemo((): ParsedLocation => {
    const entry = activeEntry();
    if (!entry) {
      return { pathname: "/", search: {}, href: "/", query: {} };
    }
    const href = buildHref(entry.pathname, entry.search);
    return {
      pathname: entry.pathname,
      search: entry.search,
      query: entry.search,
      href,
    };
  });

  const tabs = createMemo(() => routerState.tabs);

  const canGoBack = createMemo(() => {
    const tab = activeTab();
    return (tab?.historyIndex ?? 0) > 0;
  });

  const canGoForward = createMemo(() => {
    const tab = activeTab();
    if (!tab) return false;
    return tab.historyIndex < tab.history.length - 1;
  });

  const value: TabularContextValue = {
    activeTab,
    activeEntry,
    location,
    tabs,
    navigate,
    navigateBackwards,
    navigateForward,
    canGoBack,
    canGoForward,
    openTab,
    closeTab,
    reopenClosedTab,
    duplicateTab,
    canOpenTab,
    getMaxTabs,
    activateTab,
    activateTabAtIndex,
    setSearchParams,
    setDocumentTitle,
    notifyEntryState,
  };

  return <TabularContext.Provider value={value}>{props.children}</TabularContext.Provider>;
}

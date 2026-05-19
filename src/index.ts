export { Router, TabularRouter, Route, Link } from "./components";
export type { RouterProps, LinkProps } from "./components";
export { TabButton } from "./tab-button";
export type { TabButtonProps } from "./tab-button";
export { TabKeyboardShortcuts } from "./tab-keyboard-shortcuts";
export type { TabKeyboardShortcutsProps } from "./tab-keyboard-shortcuts";
export type { RouteProps } from "./route";
export {
    useNavigate,
    type UseNavigateResult,
    useLocation,
    useParams,
    useSearchParams,
    useDocumentTitle,
    useTabs,
    useMatchRoute,
    useRouteState,
    useEntryNamespace,
    useEntryContext,
} from "./hooks";
export { useTabular, TabularProvider } from "./context";
export type {
    TabularRoute,
    Tab,
    HistoryEntry,
    ClosedTabSnapshot,
    RouterInitOptions,
} from "./types";
export {
    navigate,
    navigateBackwards,
    navigateForward,
    openTab,
    closeTab,
    activateTab,
    activateTabAtIndex,
    initRouter,
    routerState,
    setDocumentTitle,
    setDocumentTitleForEntry,
    resolveEntryTitle,
    reopenClosedTab,
    duplicateTab,
    duplicateActiveTab,
    canOpenTab,
    canGoBack,
    canGoForward,
    getMaxTabs,
    DEFAULT_MAX_TABS,
    closeActiveTab,
    getActiveTab,
    setRouterState,
} from "./store";
export {
    matchRoute,
    matchRouteExact,
    parseHref,
    getRootPath,
    setRootPath,
    normalizePathname,
    resolveHref,
} from "./match";
export { getEntryNamespace } from "./entry-state";
export {
    isSyncingFromEntry,
    persistToActiveEntry,
    setSyncingFromEntry,
} from "./persist";

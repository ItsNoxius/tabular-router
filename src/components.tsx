import { createMemo, Show, splitProps, Suspense, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { TabularProvider, useTabular } from "./context";
import { beginRouteCollection, takeCollectedRoutes } from "./route-registry";
import { EntryContext } from "./hooks";
import { matchRoute } from "./match";
import { initRouter, routerState, getEntryStateVersion } from "./store";
import type { HistoryEntry } from "./types";

export type { RouteProps } from "./route";
export { Route, isRouteComponent, ROUTE_SYMBOL } from "./route";

export interface RouterProps {
  /** Optional layout shell; receives the matched page outlet as `children`. */
  root?: Component<{ children?: JSX.Element }>;
  /** Fallback route when a path is missing or unmatched. Falls back to `initialPath` or the first `<Route>`. */
  rootPath?: string;
  initialPath?: string;
  /** Maximum open tabs. Default: 20 */
  maxTabs?: number;
  children?: JSX.Element;
}

function TabularRoutePage(props: { entry: HistoryEntry; tabId: string; component: Component }) {
  return (
    <EntryContext.Provider
      value={{
        entry: props.entry,
        tabId: props.tabId,
        isActive: true,
      }}
    >
      <div class="h-full min-h-0 w-full">
        <Suspense fallback={<div class="h-full min-h-[12rem]" />}>
          <Dynamic component={props.component} />
        </Suspense>
      </div>
    </EntryContext.Provider>
  );
}

type TabularOutletView = {
  entry: HistoryEntry;
  tabId: string;
  component: Component;
};

function TabularOutletMatch(props: { match: TabularOutletView }) {
  return (
    <TabularRoutePage
      entry={props.match.entry}
      tabId={props.match.tabId}
      component={props.match.component}
    />
  );
}

function TabularOutlet() {
  const router = useTabular();
  const routes = () => routerState.routes;

  const entryId = createMemo(() => {
    getEntryStateVersion();
    return router.activeEntry()?.id;
  });

  const view = createMemo(() => {
    getEntryStateVersion();
    const entry = router.activeEntry();
    const tab = router.activeTab();
    if (!entry || !tab) return null;
    void entry.pathname;
    const matched = matchRoute(routes(), entry.pathname);
    if (!matched) return null;
    return {
      entry,
      tabId: tab.id,
      component: matched.route.component,
    };
  });

  return (
    <Show when={entryId()} keyed>
      {(_id) => {
        const match = view();
        if (!match) return null;
        return <TabularOutletMatch match={match} />;
      }}
    </Show>
  );
}

function RouterShell(props: { root?: Component<{ children?: JSX.Element }> }) {
  const outlet = <TabularOutlet />;
  if (props.root) {
    const Root = props.root;
    return <Root>{outlet}</Root>;
  }
  return outlet;
}

function RouterInternals(props: { root?: Component<{ children?: JSX.Element }> }) {
  return <RouterShell root={props.root} />;
}

function RouteCollector(props: {
  children: JSX.Element;
  rootPath?: string;
  initialPath?: string;
  maxTabs?: number;
}) {
  beginRouteCollection();
  return (
    <>
      {props.children}
      <RouterBootstrap
        rootPath={props.rootPath}
        initialPath={props.initialPath}
        maxTabs={props.maxTabs}
      />
    </>
  );
}

function RouterBootstrap(props: { rootPath?: string; initialPath?: string; maxTabs?: number }) {
  const routes = takeCollectedRoutes();
  if (routes.length > 0) {
    initRouter(routes, props.initialPath, {
      maxTabs: props.maxTabs,
      rootPath: props.rootPath,
    });
  }
  return null;
}

export function Router(props: RouterProps) {
  return (
    <TabularProvider>
      <RouteCollector
        rootPath={props.rootPath}
        initialPath={props.initialPath}
        maxTabs={props.maxTabs}
      >
        {props.children}
      </RouteCollector>
      <RouterInternals root={props.root} />
    </TabularProvider>
  );
}

/** @deprecated Use `Router` */
export const TabularRouter = Router;

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: JSX.Element;
}

export function Link(props: LinkProps) {
  const router = useTabular();
  const [local, rest] = splitProps(props, ["href", "onClick", "children"]);

  return (
    <a
      {...rest}
      href={local.href}
      onClick={(e) => {
        if (typeof local.onClick === "function") {
          local.onClick(e);
        }
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;

        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          router.openTab(local.href);
          return;
        }

        if (e.altKey || e.shiftKey) {
          return;
        }

        e.preventDefault();
        router.navigate(local.href);
      }}
    >
      {local.children}
    </a>
  );
}

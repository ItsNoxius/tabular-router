import { describe, expect, it } from "vitest";
import {
  initRouter,
  navigate,
  resolveEntryTitle,
  routerState,
  setDocumentTitleForEntry,
  setRouterState,
} from "./store";
import type { TabularRoute } from "./types";

const noop = () => null;

const routes: TabularRoute[] = [
  { path: "/home", component: noop, title: "Home" },
  { path: "/about", component: noop, title: "About" },
];

describe("resolveEntryTitle", () => {
  it("uses the route default title when no document title is set", () => {
    setRouterState({ activeTabId: "", routes: [], tabs: [] });
    initRouter(routes, "/home");

    const entry = routerState.tabs[0].history[0];
    expect(resolveEntryTitle(entry)).toBe("Home");
  });

  it("prefers useDocumentTitle over the route default", () => {
    setRouterState({ activeTabId: "", routes: [], tabs: [] });
    initRouter(routes, "/home");

    const entry = routerState.tabs[0].history[0];
    setDocumentTitleForEntry(entry.id, "Custom");

    expect(resolveEntryTitle(entry)).toBe("Custom");
  });

  it("applies route default titles on navigation", () => {
    setRouterState({ activeTabId: "", routes: [], tabs: [] });
    initRouter(routes, "/home");
    navigate("/about");

    const entry = routerState.tabs[0].history[routerState.tabs[0].historyIndex];
    expect(routerState.tabs[0].title).toBe("About");
    expect(resolveEntryTitle(entry)).toBe("About");
  });
});

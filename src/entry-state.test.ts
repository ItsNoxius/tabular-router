import { describe, expect, it } from "vitest";
import {
  getEntryStateVersion,
  initRouter,
  navigate,
  notifyEntryState,
  setRouterState,
} from "./store";
import type { TabularRoute } from "./types";

const noop = () => null;

const routes: TabularRoute[] = [
  { path: "/home", component: noop },
  { path: "/about", component: noop },
];

describe("entry state reactivity", () => {
  it("increments the entry state version when notified", () => {
    const before = getEntryStateVersion();

    notifyEntryState();

    expect(getEntryStateVersion()).toBe(before + 1);
  });

  it("notifies entry readers when navigation changes the active entry", () => {
    setRouterState({
      activeTabId: "",
      routes: [],
      tabs: [],
    });
    initRouter(routes, "/home");

    const before = getEntryStateVersion();

    navigate("/about");

    expect(getEntryStateVersion()).toBe(before + 1);
  });
});

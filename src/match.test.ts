import { beforeEach, describe, expect, it } from "vitest";
import type { TabularRoute } from "./types";
import {
  buildHref,
  getRootPath,
  matchRoute,
  matchRouteExact,
  normalizePathname,
  parseHref,
  resolveHref,
  setRootPath,
} from "./match";

const noop = () => null;

const routes: TabularRoute[] = [
  { path: "/home", component: noop },
  { path: "/about", component: noop },
  { path: "/users/:id", component: noop },
];

describe("match", () => {
  beforeEach(() => {
    setRootPath("/home");
  });

  it("configures and reads root path", () => {
    setRootPath("settings");
    expect(getRootPath()).toBe("/settings");
  });

  it("normalizes / and empty pathname to root", () => {
    expect(normalizePathname("/")).toBe("/home");
    expect(normalizePathname("")).toBe("/home");
    expect(normalizePathname("/about")).toBe("/about");
  });

  it("matches static routes", () => {
    const match = matchRouteExact(routes, "/about");
    expect(match?.route.path).toBe("/about");
    expect(match?.params).toEqual({});
  });

  it("prefers longer patterns", () => {
    const withOverlap: TabularRoute[] = [
      { path: "/users", component: noop },
      { path: "/users/:id", component: noop },
    ];
    const match = matchRouteExact(withOverlap, "/users/42");
    expect(match?.route.path).toBe("/users/:id");
    expect(match?.params).toEqual({ id: "42" });
  });

  it("decodes dynamic segment params", () => {
    const match = matchRouteExact(routes, "/users/hello%20world");
    expect(match?.params).toEqual({ id: "hello world" });
  });

  it("falls back to root when pathname is unknown", () => {
    const match = matchRoute(routes, "/missing");
    expect(match?.route.path).toBe("/home");
  });

  it("parses and builds href with search params", () => {
    const parsed = parseHref("/about?foo=1&bar=2");
    expect(parsed.pathname).toBe("/about");
    expect(parsed.search).toEqual({ foo: "1", bar: "2" });
    expect(buildHref("/about", parsed.search)).toBe("/about?foo=1&bar=2");
  });

  it("resolves empty href to root", () => {
    expect(resolveHref(routes, "")).toBe("/home");
    expect(resolveHref(routes, "   ")).toBe("/home");
  });

  it("keeps query string when falling back to root", () => {
    expect(resolveHref(routes, "/missing?q=1")).toBe("/home?q=1");
  });

  it("preserves known paths and query strings", () => {
    expect(resolveHref(routes, "/about?tab=1")).toBe("/about?tab=1");
  });
});

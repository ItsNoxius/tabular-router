import type { TabularRoute } from "./types";

export interface MatchResult {
  route: TabularRoute;
  params: Record<string, string>;
}

/** Unconfigured until `initRouter` / `<Router rootPath>` runs. */
let rootPath = "/";

/** Configure the fallback route path (set by `initRouter` / `<Router rootPath>`). */
export function setRootPath(path: string) {
  rootPath = path.startsWith("/") ? path : `/${path}`;
}

export function getRootPath() {
  return rootPath;
}

export function normalizePathname(pathname: string): string {
  if (pathname === "/" || pathname === "") {
    return rootPath;
  }
  return pathname;
}

function splitPath(path: string): string[] {
  return path.replace(/\/+$/, "").split("/").filter(Boolean);
}

function matchPattern(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = splitPath(pattern);
  const pathParts = splitPath(pathname);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const segment = patternParts[i];
    const value = pathParts[i];

    if (segment.startsWith(":")) {
      params[segment.slice(1)] = decodeURIComponent(value);
    } else if (segment !== value) {
      return null;
    }
  }

  return params;
}

/** Longer (more specific) patterns win. Does not apply root fallback. */
export function matchRouteExact(routes: TabularRoute[], pathname: string): MatchResult | null {
  const sorted = [...routes].sort((a, b) => splitPath(b.path).length - splitPath(a.path).length);

  for (const route of sorted) {
    const params = matchPattern(route.path, pathname);
    if (params !== null) {
      return { route, params };
    }
  }

  return null;
}

/** Match a pathname; unknown paths and `/` resolve to the configured root route. */
export function matchRoute(routes: TabularRoute[], pathname: string): MatchResult | null {
  const normalized = normalizePathname(pathname);
  const match = matchRouteExact(routes, normalized);
  if (match) return match;
  return matchRouteExact(routes, rootPath);
}

/** Resolve navigation href: empty/unknown paths fall back to the root route. */
export function resolveHref(routes: TabularRoute[], href?: string): string {
  if (!href?.trim()) {
    return rootPath;
  }

  const { pathname, search } = parseHref(href);
  const normalized = normalizePathname(pathname);
  if (matchRouteExact(routes, normalized)) {
    return buildHref(normalized, search);
  }
  return buildHref(rootPath, search);
}

export function parseHref(href: string): { pathname: string; search: Record<string, string> } {
  const [pathPart, queryPart = ""] = href.split("?");
  const pathname = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const search: Record<string, string> = {};

  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    params.forEach((value, key) => {
      search[key] = value;
    });
  }

  return { pathname, search };
}

export function buildHref(pathname: string, search: Record<string, string>): string {
  const keys = Object.keys(search).filter((k) => search[k] !== undefined && search[k] !== "");
  if (keys.length === 0) {
    return pathname;
  }
  const qs = new URLSearchParams();
  for (const key of keys) {
    qs.set(key, search[key]);
  }
  return `${pathname}?${qs.toString()}`;
}

/** @deprecated Dev/debug only — Router uses render-time registration in route-registry.ts */
import { children } from "solid-js";
import type { Component, JSX } from "solid-js";
import { isRouteComponent } from "./route";
import type { TabularRoute } from "./types";

export interface PartitionedChildren {
  routes: TabularRoute[];
  extras: JSX.Element[];
}

type ElementNode = JSX.Element & {
  type: unknown;
  props: { children?: unknown; path?: string; component?: Component };
};

function isFragmentType(type: unknown): boolean {
  return (
    typeof type === "symbol" ||
    (typeof type === "function" && (type as { name?: string }).name === "Fragment")
  );
}

function isRouteElement(el: ElementNode): boolean {
  if (isRouteComponent(el.type)) {
    return true;
  }
  const { path, component } = el.props ?? {};
  return typeof path === "string" && typeof component === "function";
}

function walk(node: unknown, routes: TabularRoute[], extras: JSX.Element[]) {
  if (node == null || typeof node === "boolean") return;

  if (typeof node === "function") {
    try {
      walk((node as () => unknown)(), routes, extras);
    } catch {
      /* not a child resolver */
    }
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, routes, extras);
    }
    return;
  }

  if (typeof node !== "object" || !("type" in node)) {
    return;
  }

  const el = node as ElementNode;

  if (isFragmentType(el.type)) {
    walk(el.props?.children, routes, extras);
    return;
  }

  if (isRouteElement(el)) {
    routes.push({
      path: el.props.path!,
      component: el.props.component!,
    });
    return;
  }

  extras.push(el);
}

/** Split `<Router>` children into route config and other elements (e.g. NUI wrappers). */
export function partitionRouterChildren(rawChildren: JSX.Element | undefined): PartitionedChildren {
  const routes: TabularRoute[] = [];
  const extras: JSX.Element[] = [];

  // Try raw JSX first (dev), then Solid-resolved children (production)
  walk(rawChildren, routes, extras);

  if (routes.length === 0) {
    const resolved = children(() => rawChildren);
    walk(resolved(), routes, extras);
  }

  return { routes, extras };
}

import type { Component } from "solid-js";
import { registerRoute } from "./route-registry";

export interface RouteProps {
  path: string;
  component: Component;
}

/** Stable marker survives minification (unlike function reference equality). */
export const ROUTE_SYMBOL = Symbol.for("tabular-router/route");

export type RouteComponent = Component<RouteProps> & {
  [ROUTE_SYMBOL]?: true;
};

/** Declares a route inside `<Router>`. Does not render DOM. */
export function Route(props: RouteProps) {
  registerRoute({ path: props.path, component: props.component });
  return null;
}

(Route as RouteComponent)[ROUTE_SYMBOL] = true;

export function isRouteComponent(type: unknown): boolean {
  return typeof type === "function" && (type as RouteComponent)[ROUTE_SYMBOL] === true;
}

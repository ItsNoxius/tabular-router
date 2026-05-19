import type { TabularRoute } from "./types";

let collecting = false;
const buffer: TabularRoute[] = [];

export function beginRouteCollection() {
  collecting = true;
  buffer.length = 0;
}

export function registerRoute(route: TabularRoute) {
  if (!collecting) return;
  buffer.push(route);
}

export function takeCollectedRoutes(): TabularRoute[] {
  collecting = false;
  return [...buffer];
}

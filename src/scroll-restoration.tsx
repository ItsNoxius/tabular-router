import { createEffect, on, onCleanup, type Accessor, type JSX } from "solid-js";
import { useTabular } from "./context";
import { getEntryScrollPosition, setEntryScrollPosition } from "./entry-state";

export type ScrollTarget = HTMLElement | null | undefined;

function readScroll(el: ScrollTarget) {
  if (!el) return null;
  return { top: el.scrollTop, left: el.scrollLeft };
}

function writeScroll(el: ScrollTarget, position: { top: number; left: number }) {
  if (!el) return;
  el.scrollTop = position.top;
  el.scrollLeft = position.left;
}

export interface UseScrollRestorationOptions {
  /** Namespaced scroll bucket when multiple containers share one history entry. */
  key?: string;
}

/** Persist and restore scroll position for the active history entry. */
export function useScrollRestoration(
  getTarget: Accessor<ScrollTarget>,
  options?: UseScrollRestorationOptions,
) {
  const router = useTabular();
  const scrollKey = () => options?.key ?? "default";
  let restoreFrame = 0;

  const capture = (entryId: string) => {
    const position = readScroll(getTarget());
    if (!position) return;
    setEntryScrollPosition(entryId, position, scrollKey());
  };

  const restore = (entryId: string) => {
    const position = getEntryScrollPosition(entryId, scrollKey());
    if (!position) return;
    cancelAnimationFrame(restoreFrame);
    restoreFrame = requestAnimationFrame(() => {
      writeScroll(getTarget(), position);
    });
  };

  createEffect(
    on(
      () => router.activeEntry()?.id,
      (entryId, previousEntryId) => {
        if (previousEntryId) capture(previousEntryId);
        if (entryId) restore(entryId);
      },
    ),
  );

  createEffect(
    on(
      () => [getTarget(), router.activeEntry()?.id] as const,
      ([el, entryId]) => {
        if (!el || !entryId) return;
        const onScroll = () => capture(entryId);
        el.addEventListener("scroll", onScroll, { passive: true });
        onCleanup(() => el.removeEventListener("scroll", onScroll));
      },
    ),
  );

  onCleanup(() => cancelAnimationFrame(restoreFrame));
}

export interface ScrollRestorationProps {
  /** Scroll container for the router outlet. */
  getTarget: Accessor<ScrollTarget>;
  /** Namespaced scroll bucket when multiple containers share one history entry. */
  key?: string;
}

/** Mount next to the router outlet scroll container to restore scroll per history entry. */
export function ScrollRestoration(props: ScrollRestorationProps): JSX.Element {
  useScrollRestoration(props.getTarget, { key: props.key });
  return null;
}

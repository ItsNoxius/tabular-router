import { onMount, splitProps } from "solid-js";
import { useTabular } from "./context";
import { getRootPath } from "./match";

export interface TabKeyboardShortcutsProps {
  /** Path opened by Ctrl/Cmd+T. Defaults to the router root path. */
  newTabPath?: string;
  /** Master switch. Default: true */
  enabled?: boolean;
  /** Ctrl/Cmd+W closes the active tab. Default: true */
  closeOnCtrlW?: boolean;
  /** Ctrl/Cmd+T opens a new tab. Default: true */
  newTabOnCtrlT?: boolean;
  /** Ctrl/Cmd+Shift+T reopens the last closed tab. Default: true */
  reopenOnCtrlShiftT?: boolean;
  /** Ctrl/Cmd+D duplicates the active tab. Default: true */
  duplicateOnCtrlD?: boolean;
  /** Ctrl/Cmd+1–9 switches to tab by position. Default: true */
  switchOnCtrlNumber?: boolean;
}

function ctrlDigitTabIndex(e: KeyboardEvent): number | null {
  if (e.key >= "1" && e.key <= "9") {
    return parseInt(e.key, 10) - 1;
  }
  const digit = e.code.match(/^Digit([1-9])$/)?.[1] ?? e.code.match(/^Numpad([1-9])$/)?.[1];
  if (digit) return parseInt(digit, 10) - 1;
  return null;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

export function TabKeyboardShortcuts(props: TabKeyboardShortcutsProps) {
  const router = useTabular();
  const [local] = splitProps(props, [
    "newTabPath",
    "enabled",
    "closeOnCtrlW",
    "newTabOnCtrlT",
    "reopenOnCtrlShiftT",
    "duplicateOnCtrlD",
    "switchOnCtrlNumber",
  ]);

  const enabled = () => local.enabled !== false;
  const closeOnCtrlW = () => local.closeOnCtrlW !== false;
  const newTabOnCtrlT = () => local.newTabOnCtrlT !== false;
  const reopenOnCtrlShiftT = () => local.reopenOnCtrlShiftT !== false;
  const duplicateOnCtrlD = () => local.duplicateOnCtrlD !== false;
  const switchOnCtrlNumber = () => local.switchOnCtrlNumber !== false;
  const newTabPath = () => local.newTabPath;

  onMount(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!enabled()) return;
      if (!e.ctrlKey && !e.metaKey) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key.toLowerCase();

      if (key === "w" && closeOnCtrlW()) {
        e.preventDefault();
        const tab = router.activeTab();
        if (tab) router.closeTab(tab.id);
        return;
      }

      if (key === "d" && duplicateOnCtrlD()) {
        e.preventDefault();
        router.duplicateTab();
        return;
      }

      if (switchOnCtrlNumber() && !e.shiftKey && !e.altKey) {
        const index = ctrlDigitTabIndex(e);
        if (index != null) {
          e.preventDefault();
          router.activateTabAtIndex(index);
          return;
        }
      }

      if (key === "t") {
        e.preventDefault();
        if (e.shiftKey) {
          if (reopenOnCtrlShiftT()) {
            router.reopenClosedTab();
          }
        } else if (newTabOnCtrlT()) {
          router.openTab(newTabPath() ?? getRootPath());
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return null;
}

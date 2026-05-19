import { findEntryInTabs, setEntryStatePath } from "./entry-state";
import { getActiveEntry, getActiveTab, notifyEntryState } from "./store";

let syncingFromEntry = false;

export function isSyncingFromEntry() {
  return syncingFromEntry;
}

export function setSyncingFromEntry(value: boolean) {
  syncingFromEntry = value;
}

export function persistToActiveEntry(namespace: string, data: Record<string, unknown>) {
  if (syncingFromEntry) return;
  const entry = getActiveEntry(getActiveTab());
  if (!entry) return;
  if (!findEntryInTabs(entry.id)) return;
  setEntryStatePath(entry, [namespace, "__data"], data);
  notifyEntryState();
}

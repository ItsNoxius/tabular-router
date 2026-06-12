import { describe, expect, it } from "vitest";
import { getEntryStateVersion, notifyEntryState } from "./store";

describe("entry state reactivity", () => {
  it("increments the entry state version when notified", () => {
    const before = getEntryStateVersion();

    notifyEntryState();

    expect(getEntryStateVersion()).toBe(before + 1);
  });
});

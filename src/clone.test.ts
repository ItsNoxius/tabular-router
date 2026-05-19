import { describe, expect, it } from "vitest";
import { cloneForStorage } from "./clone";

describe("cloneForStorage", () => {
  it("returns primitives as-is", () => {
    expect(cloneForStorage(1)).toBe(1);
    expect(cloneForStorage("x")).toBe("x");
    expect(cloneForStorage(null)).toBe(null);
  });

  it("deep-clones plain objects", () => {
    const value = { a: 1, nested: { b: 2 } };
    const cloned = cloneForStorage(value);
    expect(cloned).toEqual(value);
    expect(cloned).not.toBe(value);
    cloned.nested.b = 99;
    expect(value.nested.b).toBe(2);
  });
});

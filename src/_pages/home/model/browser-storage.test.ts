import { describe, expect, it } from "vitest";

import { getBrowserStorage } from "./browser-storage";

describe("getBrowserStorage", () => {
  it("returns browser storage when access is available", () => {
    const storage = {} as Storage;

    expect(getBrowserStorage(() => storage)).toBe(storage);
  });

  it("returns null when browser privacy settings deny access", () => {
    expect(
      getBrowserStorage(() => {
        throw new DOMException("Access denied", "SecurityError");
      })
    ).toBeNull();
  });
});

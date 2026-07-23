import { describe, expect, it } from "vitest";

import { toKopecks } from "./format";

describe("toKopecks", () => {
  it("accepts Russian decimal notation", () => {
    expect(toKopecks("1 234,56")).toBe(123_456);
  });

  it("rejects invalid and non-positive values", () => {
    expect(toKopecks("0")).toBeNull();
    expect(toKopecks("12,345")).toBeNull();
    expect(toKopecks("not money")).toBeNull();
  });
});

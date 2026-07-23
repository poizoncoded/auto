import { describe, expect, it } from "vitest";

import { createSessionToken, hashSessionToken } from "./session";

describe("session tokens", () => {
  it("creates an opaque token and a stable storage hash", () => {
    const token = createSessionToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(hashSessionToken(token)).not.toBe(token);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });
});

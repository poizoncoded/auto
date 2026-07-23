import { describe, expect, it } from "vitest";

import { hashPin, verifyPin } from "./pin";

describe("PIN credentials", () => {
  it("stores a six-digit PIN as a verifiable salted hash", async () => {
    const credential = await hashPin("123456");

    expect(credential).not.toContain("123456");
    await expect(verifyPin("123456", credential)).resolves.toBe(true);
    await expect(verifyPin("654321", credential)).resolves.toBe(false);
  });

  it("rejects PINs that are not exactly six digits", async () => {
    await expect(hashPin("12345")).rejects.toThrow("PIN must contain six digits");
  });
});

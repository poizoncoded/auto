import { describe, expect, it } from "vitest";

import {
  clearLocalSessionLock,
  isLocalSessionLocked,
  markLocalSessionLocked,
  type LocalLockStorage
} from "./local-lock";

class MemoryStorage implements LocalLockStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("local profile lock", () => {
  it("survives reload storage until an explicit unlock clears it", () => {
    const storage = new MemoryStorage();

    expect(isLocalSessionLocked(storage)).toBe(false);
    markLocalSessionLocked(storage);
    expect(isLocalSessionLocked(storage)).toBe(true);
    clearLocalSessionLock(storage);
    expect(isLocalSessionLocked(storage)).toBe(false);
  });
});

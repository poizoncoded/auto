import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  consumeAuthAttempt,
  resetAuthAttempts,
  type AuthAttemptKey,
  type AuthRateLimitPolicy
} from "@/server/security/auth-rate-limit";

import { createDisposableDatabase, type DisposableDatabase } from "./disposable-database";

const policy: AuthRateLimitPolicy = {
  blockMs: 1_000,
  maxAttempts: 2,
  windowMs: 1_000
};

describe("persistent auth throttling", () => {
  let disposable: DisposableDatabase;

  beforeAll(async () => {
    disposable = await createDisposableDatabase("auth_throttle");
  }, 30_000);

  afterAll(async () => {
    await disposable?.dispose();
  });

  function key(subject: string): AuthAttemptKey {
    return { clientAddress: "127.0.0.1", operation: "login", subject };
  }

  it("returns 429 after the bounded number of attempts", async () => {
    const attemptKey = key("blocked");
    const now = new Date("2026-07-20T00:00:00Z");

    await consumeAuthAttempt(disposable.database, attemptKey, { now, policy });
    await consumeAuthAttempt(disposable.database, attemptKey, { now, policy });
    await expect(
      consumeAuthAttempt(disposable.database, attemptKey, { now, policy })
    ).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
  });

  it("resets successful login or PIN-change state", async () => {
    const attemptKey = key("reset");
    const now = new Date("2026-07-20T00:00:00Z");

    await consumeAuthAttempt(disposable.database, attemptKey, { now, policy });
    await consumeAuthAttempt(disposable.database, attemptKey, { now, policy });
    await resetAuthAttempts(disposable.database, attemptKey);

    await expect(
      consumeAuthAttempt(disposable.database, attemptKey, { now, policy })
    ).resolves.toBeUndefined();
  });

  it("expires blocked state after its bounded window", async () => {
    const attemptKey = key("expiry");
    const now = new Date("2026-07-20T00:00:00Z");

    await consumeAuthAttempt(disposable.database, attemptKey, { now, policy });
    await consumeAuthAttempt(disposable.database, attemptKey, { now, policy });
    await expect(
      consumeAuthAttempt(disposable.database, attemptKey, { now, policy })
    ).rejects.toMatchObject({ status: 429 });

    await expect(
      consumeAuthAttempt(disposable.database, attemptKey, {
        now: new Date(now.getTime() + 1_001),
        policy
      })
    ).resolves.toBeUndefined();
  });

  it("atomically limits concurrent attempts", async () => {
    const attemptKey = key("concurrent");
    const now = new Date("2026-07-20T00:00:00Z");
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        consumeAuthAttempt(disposable.database, attemptKey, { now, policy })
      )
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(4);
  });

  it("shares one concurrent limit across UUID case variants", async () => {
    const lowerUuid = "770e8400-e29b-41d4-a716-44665544aabb";
    const upperUuid = lowerUuid.toUpperCase();
    const now = new Date("2026-07-20T01:00:00Z");
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, index) =>
        consumeAuthAttempt(disposable.database, key(index % 2 ? upperUuid : lowerUuid), {
          now,
          policy
        })
      )
    );
    const rejected = results.filter((result) => result.status === "rejected");

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect(rejected).toHaveLength(4);
    expect(rejected.every((result) => result.reason?.status === 429)).toBe(true);
  });
});

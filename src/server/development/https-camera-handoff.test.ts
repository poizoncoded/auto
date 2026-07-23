import { describe, expect, it } from "vitest";

import {
  buildDevelopmentCameraHandoffUrl,
  DevelopmentCameraHandoffStore
} from "./https-camera-handoff";

describe("DevelopmentCameraHandoffStore", () => {
  it("consumes a handoff once for the authenticated profile", () => {
    const store = new DevelopmentCameraHandoffStore({
      now: () => 1_000,
      tokenFactory: () => "single-use-token"
    });
    const token = store.issue("770e8400-e29b-41d4-a716-446655440001");

    expect(token).toBe("single-use-token");
    expect(store.consume(token)).toBe("770e8400-e29b-41d4-a716-446655440001");
    expect(store.consume(token)).toBeNull();
  });

  it("rejects an expired handoff", () => {
    let now = 1_000;
    const store = new DevelopmentCameraHandoffStore({
      now: () => now,
      tokenFactory: () => "expired-camera-token",
      ttlMs: 60_000
    });
    const token = store.issue("770e8400-e29b-41d4-a716-446655440001");

    now += 60_001;

    expect(store.consume(token)).toBeNull();
  });
});

describe("buildDevelopmentCameraHandoffUrl", () => {
  it("builds a no-credential consume URL on the validated tunnel", () => {
    expect(
      buildDevelopmentCameraHandoffUrl(
        "https://camera-ready.trycloudflare.com",
        "single-use-token"
      )
    ).toBe(
      "https://camera-ready.trycloudflare.com/api/development/https-camera?token=single-use-token"
    );
  });

  it.each([
    "http://camera-ready.trycloudflare.com",
    "https://camera-ready.trycloudflare.com.evil.example"
  ])("rejects an unsafe tunnel origin: %s", (origin) => {
    expect(buildDevelopmentCameraHandoffUrl(origin, "single-use-token")).toBeNull();
  });
});

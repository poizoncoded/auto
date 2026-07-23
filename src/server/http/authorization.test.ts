import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  destroySession: vi.fn(),
  getDataSource: vi.fn()
}));

vi.mock("@/server/database/data-source", () => ({
  getDataSource: mocks.getDataSource
}));

vi.mock("@/server/security/session-store", () => ({
  destroySession: mocks.destroySession,
  getSessionDurationSeconds: () => 60,
  getSessionUserId: vi.fn()
}));

import {
  clearSessionCookie,
  sessionCookieName,
  setSessionCookie
} from "./authorization";

describe("session cookie clearing", () => {
  beforeEach(() => {
    mocks.getDataSource.mockResolvedValue({});
  });

  it("expires the cookie even when database revocation fails", async () => {
    const deletionError = new Error("database unavailable");
    const cookies = {
      delete: vi.fn(),
      get: vi.fn((name: string) => (name === sessionCookieName ? { value: "token" } : undefined))
    };
    mocks.destroySession.mockRejectedValueOnce(deletionError);

    await expect(
      clearSessionCookie({ cookies } as unknown as APIContext)
    ).rejects.toBe(deletionError);
    expect(cookies.delete).toHaveBeenCalledWith(sessionCookieName, { path: "/" });
  });

  it("marks a session cookie secure when HTTPS is forwarded by the tunnel", () => {
    const cookies = { set: vi.fn() };
    const request = new Request("http://camera-ready.trycloudflare.com/api/auth/login", {
      headers: { "x-forwarded-proto": "https" }
    });

    setSessionCookie(
      { cookies, request } as unknown as APIContext,
      {
        expiresAt: new Date("2026-08-20T00:00:00Z"),
        token: "replacement-token",
        userId: "770e8400-e29b-41d4-a716-446655440001"
      }
    );

    expect(cookies.set).toHaveBeenCalledWith(
      sessionCookieName,
      "replacement-token",
      expect.objectContaining({ secure: true })
    );
  });
});

import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildUrl: vi.fn(),
  consume: vi.fn(),
  createSession: vi.fn(),
  getDataSource: vi.fn(),
  issue: vi.fn(),
  readHttpsUrl: vi.fn(),
  requireUser: vi.fn(),
  setSessionCookie: vi.fn()
}));

vi.mock("@/server/database/data-source", () => ({ getDataSource: mocks.getDataSource }));
vi.mock("@/server/development/https-camera-handoff", () => ({
  buildDevelopmentCameraHandoffUrl: mocks.buildUrl,
  developmentCameraHandoffs: {
    consume: mocks.consume,
    issue: mocks.issue
  }
}));
vi.mock("@/server/development/https-tunnel", () => ({
  readDevelopmentHttpsUrl: mocks.readHttpsUrl
}));
vi.mock("@/server/http/authorization", () => ({
  requireUser: mocks.requireUser,
  setSessionCookie: mocks.setSessionCookie
}));
vi.mock("@/server/security/session-store", () => ({ createSession: mocks.createSession }));

import { GET, POST } from "./https-camera";

const tunnelOrigin = "https://camera-ready.trycloudflare.com";
const userId = "770e8400-e29b-41d4-a716-446655440001";
const session = {
  expiresAt: new Date("2026-08-20T00:00:00Z"),
  token: "replacement-session-token",
  userId
};

function context(request: Request): APIContext {
  return { request } as APIContext;
}

describe("development HTTPS camera handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readHttpsUrl.mockResolvedValue(tunnelOrigin);
    mocks.requireUser.mockResolvedValue(userId);
    mocks.issue.mockReturnValue("single-use-camera-token");
    mocks.buildUrl.mockReturnValue(
      `${tunnelOrigin}/api/development/https-camera?token=single-use-camera-token`
    );
    mocks.consume.mockReturnValue(userId);
    mocks.getDataSource.mockResolvedValue({});
    mocks.createSession.mockResolvedValue(session);
  });

  it("issues a one-time URL only for the unlocked profile", async () => {
    const response = await POST(
      context(
        new Request("http://10.8.1.2:4321/api/development/https-camera", {
          headers: { origin: "http://10.8.1.2:4321" },
          method: "POST"
        })
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: `${tunnelOrigin}/api/development/https-camera?token=single-use-camera-token`
    });
    expect(mocks.requireUser).toHaveBeenCalledOnce();
    expect(mocks.issue).toHaveBeenCalledWith(userId);
  });

  it("consumes the handoff over HTTPS and sets the new origin session", async () => {
    const apiContext = context(
      new Request(
        "http://camera-ready.trycloudflare.com/api/development/https-camera?token=single-use-camera-token",
        { headers: { "x-forwarded-proto": "https" } }
      )
    );
    const response = await GET(apiContext);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/receipts?camera=1");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.consume).toHaveBeenCalledWith("single-use-camera-token");
    expect(mocks.setSessionCookie).toHaveBeenCalledWith(apiContext, session);
  });

  it("rejects consumption outside the active HTTPS tunnel", async () => {
    const response = await GET(
      context(
        new Request(
          "http://localhost:4321/api/development/https-camera?token=single-use-camera-token"
        )
      )
    );

    expect(response.status).toBe(400);
    expect(mocks.consume).not.toHaveBeenCalled();
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });
});

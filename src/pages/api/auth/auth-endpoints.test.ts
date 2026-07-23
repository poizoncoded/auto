import type { APIContext } from "astro";
import { AppError } from "@/server/http/error";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateUser: vi.fn(),
  changePin: vi.fn(),
  consumeAuthAttempt: vi.fn(),
  createSession: vi.fn(),
  getDataSource: vi.fn(),
  registerUser: vi.fn(),
  requireUser: vi.fn(),
  resetAuthAttempts: vi.fn(),
  setSessionCookie: vi.fn()
}));

vi.mock("@/server/database/data-source", () => ({ getDataSource: mocks.getDataSource }));
vi.mock("@/server/http/authorization", () => ({
  requireUser: mocks.requireUser,
  setSessionCookie: mocks.setSessionCookie
}));
vi.mock("@/server/security/auth-rate-limit", () => ({
  consumeAuthAttempt: mocks.consumeAuthAttempt,
  resetAuthAttempts: mocks.resetAuthAttempts
}));
vi.mock("@/server/security/session-store", () => ({ createSession: mocks.createSession }));
vi.mock("@/server/services/auth", () => ({
  authenticateUser: mocks.authenticateUser,
  changePin: mocks.changePin,
  registerUser: mocks.registerUser
}));

import { POST as login } from "./login";
import { PATCH as changePin } from "./pin";
import { POST as register } from "./register";

const user = {
  displayName: "Анна",
  id: "770e8400-e29b-41d4-a716-446655440001"
};
const session = {
  expiresAt: new Date("2026-08-20T00:00:00Z"),
  token: "replacement-token",
  userId: user.id
};

function context(method: "PATCH" | "POST", body: unknown): APIContext {
  return {
    clientAddress: "127.0.0.1",
    request: new Request("http://127.0.0.1:4321/api/auth/test", {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:4321"
      },
      method
    })
  } as APIContext;
}

describe("PIN endpoint throttling and rotation", () => {
  beforeEach(() => {
    mocks.getDataSource.mockResolvedValue({});
    mocks.requireUser.mockResolvedValue(user.id);
    mocks.authenticateUser.mockResolvedValue(user);
    mocks.registerUser.mockResolvedValue(user);
    mocks.changePin.mockResolvedValue(session);
    mocks.createSession.mockResolvedValue(session);
  });

  it.each([
    ["login", () => login(context("POST", { pin: "123456", userId: user.id })), mocks.authenticateUser],
    ["registration", () => register(context("POST", { displayName: "Анна", pin: "123456" })), mocks.registerUser],
    ["PIN change", () => changePin(context("PATCH", { currentPin: "123456", nextPin: "654321" })), mocks.changePin]
  ])("blocks %s before expensive credential work", async (_label, request, expensiveWork) => {
    mocks.consumeAuthAttempt.mockRejectedValueOnce(
      new AppError("Слишком много попыток", "RATE_LIMITED", 429)
    );

    const response = await request();

    expect(response.status).toBe(429);
    expect(expensiveWork).not.toHaveBeenCalled();
  });

  it("resets login attempts after success", async () => {
    const response = await login(context("POST", { pin: "123456", userId: user.id }));

    expect(response.status).toBe(200);
    expect(mocks.consumeAuthAttempt).toHaveBeenCalledOnce();
    expect(mocks.resetAuthAttempts).toHaveBeenCalledOnce();
  });

  it("retains login attempt state after an invalid PIN", async () => {
    mocks.authenticateUser.mockRejectedValueOnce(
      new AppError("Неверный PIN", "INVALID_PIN", 401)
    );

    const response = await login(context("POST", { pin: "123456", userId: user.id }));

    expect(response.status).toBe(401);
    expect(mocks.consumeAuthAttempt).toHaveBeenCalledOnce();
    expect(mocks.resetAuthAttempts).not.toHaveBeenCalled();
  });

  it("keeps successful registrations in the request limit", async () => {
    const response = await register(context("POST", { displayName: "Анна", pin: "123456" }));

    expect(response.status).toBe(201);
    expect(mocks.consumeAuthAttempt).toHaveBeenCalledOnce();
    expect(mocks.resetAuthAttempts).not.toHaveBeenCalled();
  });

  it("rotates the cookie and resets attempts after a successful PIN change", async () => {
    const apiContext = context("PATCH", { currentPin: "123456", nextPin: "654321" });
    const response = await changePin(apiContext);

    expect(response.status).toBe(200);
    expect(mocks.resetAuthAttempts).toHaveBeenCalledOnce();
    expect(mocks.setSessionCookie).toHaveBeenCalledWith(apiContext, session);
  });
});

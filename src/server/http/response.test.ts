import type { APIContext } from "astro";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { api, json, readJson } from "./response";

function contextFor(request: Request): APIContext {
  return { request } as APIContext;
}

describe("API request boundaries", () => {
  it.each([
    ["missing", undefined],
    ["different origin", "http://127.0.0.1:9999"]
  ])("rejects a %s Origin on mutation requests", async (_label, origin) => {
    const handler = vi.fn(async () => json({ ok: true }));
    const headers = origin ? { origin } : undefined;
    const response = await api(handler)(
      contextFor(new Request("http://127.0.0.1:4321/api/example", { headers, method: "POST" }))
    );

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts the exact request origin on a mutation request", async () => {
    const handler = vi.fn(async () => json({ ok: true }));
    const response = await api(handler)(
      contextFor(
        new Request("http://127.0.0.1:4321/api/example", {
          headers: { origin: "http://127.0.0.1:4321" },
          method: "POST"
        })
      )
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("accepts the public HTTPS origin forwarded by the development tunnel", async () => {
    const handler = vi.fn(async () => json({ ok: true }));
    const response = await api(handler)(
      contextFor(
        new Request("http://camera-ready.trycloudflare.com/api/example", {
          headers: {
            origin: "https://camera-ready.trycloudflare.com",
            "x-forwarded-proto": "https"
          },
          method: "POST"
        })
      )
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("still rejects a different origin behind the HTTPS proxy", async () => {
    const handler = vi.fn(async () => json({ ok: true }));
    const response = await api(handler)(
      contextFor(
        new Request("http://camera-ready.trycloudflare.com/api/example", {
          headers: {
            origin: "https://attacker.example",
            "x-forwarded-proto": "https"
          },
          method: "POST"
        })
      )
    );

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("keeps safe requests available without an Origin header", async () => {
    const handler = vi.fn(async () => json({ ok: true }));
    const response = await api(handler)(
      contextFor(new Request("http://127.0.0.1:4321/api/example"))
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("rejects JSON bodies sent with a non-JSON content type", async () => {
    const request = new Request("http://127.0.0.1:4321/api/example", {
      body: JSON.stringify({ value: "ok" }),
      headers: { "content-type": "text/plain" },
      method: "POST"
    });

    await expect(readJson(request, z.object({ value: z.string() }))).rejects.toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
      status: 415
    });
  });

  it("accepts application/json with a charset parameter", async () => {
    const request = new Request("http://127.0.0.1:4321/api/example", {
      body: JSON.stringify({ value: "ok" }),
      headers: { "content-type": "application/json; charset=utf-8" },
      method: "POST"
    });

    await expect(readJson(request, z.object({ value: z.string() }))).resolves.toEqual({
      value: "ok"
    });
  });

  it("returns stable field errors for invalid JSON input", async () => {
    const handler = api(async (context) => {
      await readJson(
        context.request,
        z.object({
          amountKopecks: z.number().positive("Введите сумму больше нуля"),
          categoryId: z.uuid("Выберите категорию")
        })
      );
      return json({ ok: true });
    });
    const response = await handler(
      contextFor(
        new Request("http://127.0.0.1:4321/api/expenses", {
          body: JSON.stringify({ amountKopecks: 0, categoryId: "" }),
          headers: {
            "content-type": "application/json",
            origin: "http://127.0.0.1:4321"
          },
          method: "POST"
        })
      )
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_INPUT",
        fields: {
          amountKopecks: "Введите сумму больше нуля",
          categoryId: "Выберите категорию"
        },
        message: "Введите сумму больше нуля"
      }
    });
  });
});

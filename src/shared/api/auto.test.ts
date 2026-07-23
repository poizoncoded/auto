import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson } from "./auto";

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("preserves structured API validation errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "INVALID_INPUT",
              fields: { amountKopecks: "Введите сумму больше нуля" },
              message: "Введите сумму больше нуля"
            }
          }),
          {
            headers: { "content-type": "application/json" },
            status: 400
          }
        )
      )
    );

    await expect(
      requestJson("/api/expenses", { body: { amountKopecks: 0 }, method: "POST" })
    ).rejects.toMatchObject({
      code: "INVALID_INPUT",
      fields: { amountKopecks: "Введите сумму больше нуля" },
      message: "Введите сумму больше нуля",
      status: 400
    });
  });

  it.each(["POST", "DELETE"] as const)(
    "sends a JSON body for a bodyless %s mutation",
    async (method) => {
      const request = vi.fn().mockResolvedValue(Response.json({ ok: true }));
      vi.stubGlobal("fetch", request);

      await requestJson("/api/example", { method });

      expect(request).toHaveBeenCalledWith("/api/example", {
        body: "{}",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method
      });
    }
  );
});

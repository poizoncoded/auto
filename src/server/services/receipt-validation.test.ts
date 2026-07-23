import type { DataSource } from "typeorm";
import { describe, expect, it, vi } from "vitest";

import type { Receipt } from "@/server/database/entities";
import { reviewReceiptSchema } from "@/server/http/schemas";
import { createReceipt } from "./finance";

const maximumAmountKopecks = 2_000_000_000;
const maximumReceiptPayload =
  "t=20260720T1200&s=20000000.00&fn=9282440301234567&i=12345&fp=9876543210&n=1";

describe("receipt service validation", () => {
  it("maps malformed fiscal QR input to a specific HTTP 400 application error", async () => {
    await expect(
      createReceipt({} as DataSource, crypto.randomUUID(), { rawPayload: "not-a-receipt" })
    ).rejects.toMatchObject({ code: "INVALID_RECEIPT_QR", status: 400 });
  });

  it("preserves the application maximum from receipt import through review validation", async () => {
    const receiptId = crypto.randomUUID();
    const save = vi.fn(async (receipt: Partial<Receipt>) =>
      ({
        ...receipt,
        createdAt: new Date("2026-07-20T12:00:00Z"),
        id: receiptId,
        reviewedAt: null
      }) as Receipt
    );
    const database = {
      getRepository: () => ({ save })
    } as unknown as DataSource;

    const imported = await createReceipt(database, crypto.randomUUID(), {
      rawPayload: maximumReceiptPayload
    });
    const reviewInput = reviewReceiptSchema.parse({
      amountKopecks: imported.totalKopecks,
      categoryId: crypto.randomUUID(),
      occurredOn: "2026-07-20"
    });

    expect(imported.totalKopecks).toBe(maximumAmountKopecks);
    expect(reviewInput.amountKopecks).toBe(maximumAmountKopecks);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ totalKopecks: maximumAmountKopecks })
    );
  });

  it("maps a receipt total above the application maximum to HTTP 400", async () => {
    await expect(
      createReceipt({} as DataSource, crypto.randomUUID(), {
        rawPayload:
          "t=20260720T1200&s=20000000.01&fn=9282440301234567&i=12345&fp=9876543210&n=1"
      })
    ).rejects.toMatchObject({ code: "INVALID_RECEIPT_QR", status: 400 });
  });
});

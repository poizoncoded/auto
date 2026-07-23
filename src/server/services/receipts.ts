import type { DataSource } from "typeorm";

import { Receipt } from "@/server/database/entities";
import { AppError } from "@/server/http/error";
import type { CreateReceiptInput, ReviewReceiptInput } from "@/server/http/schemas";
import type { ExpenseRecord, ReceiptRecord } from "@/shared/api/auto";
import { parseReceiptQr } from "@/shared/lib/receipt";

import { createExpenseWithManager } from "./expenses";
import { toReceiptRecord } from "./finance-records";

export async function createReceipt(
  database: DataSource,
  userId: string,
  input: CreateReceiptInput
): Promise<ReceiptRecord> {
  let parsed: ReturnType<typeof parseReceiptQr>;

  try {
    parsed = parseReceiptQr(input.rawPayload);
  } catch {
    throw new AppError("Некорректные данные QR-кода чека", "INVALID_RECEIPT_QR", 400);
  }

  const receipt = await database.getRepository(Receipt).save({
    decodedPayload: input.rawPayload,
    fiscalDocumentNumber: parsed.fiscalDocumentNumber,
    fiscalDriveNumber: parsed.fiscalDriveNumber,
    fiscalSign: parsed.fiscalSign,
    issuedAt: new Date(`${parsed.issuedAt}:00Z`),
    operationType: parsed.operationType,
    providerKey: null,
    rawMetadata: { source: "qr" },
    status: "pending",
    totalKopecks: parsed.totalKopecks,
    userId
  });

  return toReceiptRecord(receipt);
}

export async function reviewReceipt(
  database: DataSource,
  userId: string,
  receiptId: string,
  input: ReviewReceiptInput
): Promise<ExpenseRecord> {
  return database.transaction(async (manager) => {
    const receipt = await manager.findOneBy(Receipt, { id: receiptId, userId, status: "pending" });

    if (!receipt) {
      throw new AppError("Чек недоступен для проверки", "NOT_FOUND", 404);
    }

    const expense = await createExpenseWithManager(manager, userId, input, receipt.id);
    receipt.reviewedAt = new Date();
    receipt.status = "reviewed";
    await manager.save(receipt);

    return expense;
  });
}

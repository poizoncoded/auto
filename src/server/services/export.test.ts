import { describe, expect, it } from "vitest";

import type { BootstrapData, ExpenseRecord } from "./finance";
import { exportExpensesCsv } from "./export";

function expense(overrides: Partial<ExpenseRecord>): ExpenseRecord {
  return {
    amountKopecks: 12_300,
    categoryId: crypto.randomUUID(),
    categoryName: "Обычная",
    clientMutationId: crypto.randomUUID(),
    id: crypto.randomUUID(),
    merchant: "Сервис",
    note: "Плановое ТО",
    occurredOn: "2026-07-20",
    receiptId: null,
    vehicleId: null,
    ...overrides
  };
}

function data(expenses: ExpenseRecord[]): BootstrapData {
  return { categories: [], expenses, receipts: [], vehicles: [] };
}

describe("CSV export", () => {
  it("neutralizes formula-like category, merchant, and note cells", async () => {
    const csv = await exportExpensesCsv(
      data([
        expense({
          categoryName: "=2+2",
          merchant: "+SUM(1,1)",
          note: "-10+20"
        }),
        expense({
          categoryName: "Обычная",
          merchant: "\t@CMD",
          note: " \r=2+2"
        })
      ])
    );

    expect(csv).toContain("\"'=2+2\"");
    expect(csv).toContain("\"'+SUM(1,1)\"");
    expect(csv).toContain("\"'-10+20\"");
    expect(csv).toContain("\"'\t@CMD\"");
    expect(csv).toContain("\"' \r=2+2\"");
    expect(csv).toContain("\"Обычная\"");
    expect(csv).not.toContain("\"'Обычная\"");
  });
});

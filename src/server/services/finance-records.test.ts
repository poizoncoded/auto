import { describe, expect, it } from "vitest";

import { Category, Expense, FuelEntry, Receipt, Vehicle } from "@/server/database/entities";

import {
  toCategoryRecord,
  toExpenseRecord,
  toReceiptRecord,
  toVehicleRecord
} from "./finance-records";

describe("finance record mapping", () => {
  it("maps an expense and its optional fuel details", () => {
    const category = Object.assign(new Category(), { id: "category-1", name: "Топливо" });
    const expense = Object.assign(new Expense(), {
      amountKopecks: 5_600_00,
      categoryId: category.id,
      clientMutationId: "mutation-1",
      id: "expense-1",
      merchant: null,
      note: "Полный бак",
      occurredOn: "2026-07-21",
      receiptId: null,
      vehicleId: "vehicle-1"
    });
    const fuelEntry = Object.assign(new FuelEntry(), {
      kind: "fuel" as const,
      odometerKm: 42_300,
      quantityMilliUnits: 45_500,
      unitPriceKopecks: 6_150
    });

    expect(toExpenseRecord(expense, category, fuelEntry)).toEqual({
      amountKopecks: 5_600_00,
      categoryId: "category-1",
      categoryName: "Топливо",
      clientMutationId: "mutation-1",
      fuelEntry: {
        kind: "fuel",
        odometerKm: 42_300,
        quantityMilliUnits: 45_500,
        unitPriceKopecks: 6_150
      },
      id: "expense-1",
      merchant: null,
      note: "Полный бак",
      occurredOn: "2026-07-21",
      receiptId: null,
      vehicleId: "vehicle-1"
    });
  });

  it("omits fuel details and preserves nullable fields", () => {
    const category = Object.assign(new Category(), { id: "category-2", name: "Парковка" });
    const expense = Object.assign(new Expense(), {
      amountKopecks: 20_000,
      categoryId: category.id,
      clientMutationId: null,
      id: "expense-2",
      merchant: "Паркинг",
      note: null,
      occurredOn: "2026-07-20",
      receiptId: null,
      vehicleId: null
    });

    expect(toExpenseRecord(expense, category)).not.toHaveProperty("fuelEntry");
    expect(toExpenseRecord(expense, category)).toMatchObject({
      merchant: "Паркинг",
      note: null,
      vehicleId: null
    });
  });

  it("maps vehicle and category API records", () => {
    const vehicle = Object.assign(new Vehicle(), {
      archived: false,
      energyUnit: "l",
      id: "vehicle-1",
      name: "Octavia",
      type: "Автомобиль"
    });
    const category = Object.assign(new Category(), {
      color: "#147D64",
      icon: "Fuel",
      id: "category-1",
      name: "Топливо",
      sortOrder: 10
    });

    expect(toVehicleRecord(vehicle)).toEqual({
      archived: false,
      energyUnit: "l",
      id: "vehicle-1",
      name: "Octavia",
      type: "Автомобиль"
    });
    expect(toCategoryRecord(category)).toEqual({
      color: "#147D64",
      icon: "Fuel",
      id: "category-1",
      name: "Топливо",
      sortOrder: 10
    });
  });

  it("formats receipt timestamps for API records", () => {
    const receipt = Object.assign(new Receipt(), {
      fiscalDocumentNumber: "123",
      fiscalDriveNumber: "456",
      fiscalSign: "789",
      id: "receipt-1",
      issuedAt: new Date("2026-07-21T18:42:00.000Z"),
      status: "pending" as const,
      totalKopecks: 99_900
    });

    expect(toReceiptRecord(receipt)).toEqual({
      fiscalDocumentNumber: "123",
      fiscalDriveNumber: "456",
      fiscalSign: "789",
      id: "receipt-1",
      issuedAt: "2026-07-21T18:42",
      status: "pending",
      totalKopecks: 99_900
    });
  });
});

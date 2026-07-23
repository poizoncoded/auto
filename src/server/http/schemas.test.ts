import { describe, expect, it } from "vitest";

import {
  createExpenseSchema,
  localDateSchema,
  registerUserSchema,
  reviewReceiptSchema,
  updateExpenseSchema
} from "./schemas";

describe("request schemas", () => {
  it("normalizes a new Russian user profile", () => {
    expect(registerUserSchema.parse({ displayName: "  Анна  ", pin: "123456" })).toEqual({
      displayName: "Анна",
      pin: "123456"
    });
  });

  it("accepts a fuel expense only with owned record identifiers", () => {
    const expense = createExpenseSchema.parse({
      amountKopecks: 456780,
      categoryId: "770e8400-e29b-41d4-a716-446655440001",
      clientMutationId: "770e8400-e29b-41d4-a716-446655440002",
      fuelEntry: {
        kind: "fuel",
        odometerKm: 10500,
        quantityMilliUnits: 30000,
        unitPriceKopecks: 15226
      },
      occurredOn: "2026-07-19",
      vehicleId: "770e8400-e29b-41d4-a716-446655440000"
    });

    expect(expense.amountKopecks).toBe(456780);
    expect(expense.fuelEntry?.kind).toBe("fuel");
  });

  it("requires a stable client mutation ID for each new expense", () => {
    expect(
      createExpenseSchema.safeParse({
        amountKopecks: 456780,
        categoryId: "770e8400-e29b-41d4-a716-446655440001",
        occurredOn: "2026-07-19"
      }).success
    ).toBe(false);
  });

  it("rejects an expense without a valid category identifier", () => {
    expect(() =>
      createExpenseSchema.parse({
        amountKopecks: 1,
        categoryId: "not-a-uuid",
        occurredOn: "2026-07-19"
      })
    ).toThrow();
  });

  it("allows an expense edit to clear optional vehicle and fuel details", () => {
    expect(updateExpenseSchema.parse({ fuelEntry: null, vehicleId: null })).toEqual({
      fuelEntry: null,
      vehicleId: null
    });
  });

  it("applies one amount ceiling to expense and receipt review inputs", () => {
    const categoryId = "770e8400-e29b-41d4-a716-446655440001";
    const clientMutationId = "770e8400-e29b-41d4-a716-446655440002";
    const maximum = 2_000_000_000;
    const oneOver = maximum + 1;
    const expenseBase = { categoryId, occurredOn: "2026-07-20" };

    expect(
      createExpenseSchema.parse({
        ...expenseBase,
        amountKopecks: maximum,
        clientMutationId
      }).amountKopecks
    ).toBe(maximum);
    expect(updateExpenseSchema.parse({ amountKopecks: maximum }).amountKopecks).toBe(maximum);
    expect(
      reviewReceiptSchema.parse({ ...expenseBase, amountKopecks: maximum }).amountKopecks
    ).toBe(maximum);

    expect(
      createExpenseSchema.safeParse({
        ...expenseBase,
        amountKopecks: oneOver,
        clientMutationId
      }).success
    ).toBe(false);
    expect(updateExpenseSchema.safeParse({ amountKopecks: oneOver }).success).toBe(false);
    expect(
      reviewReceiptSchema.safeParse({ ...expenseBase, amountKopecks: oneOver }).success
    ).toBe(false);
  });

  it("accepts a real leap day", () => {
    expect(localDateSchema.parse("2024-02-29")).toBe("2024-02-29");
  });

  it.each([
    "0000-01-01",
    "2023-02-29",
    "2026-04-31",
    "2026-00-10",
    "2026-13-10",
    "2026-01-00"
  ])(
    "rejects impossible calendar date %s",
    (date) => {
      expect(localDateSchema.safeParse(date).success).toBe(false);
    }
  );
});

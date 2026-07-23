import { describe, expect, it } from "vitest";

import type { BootstrapData } from "@/shared/api/auto";

import { latestExpenseDefaults } from "./workspace-data";

const categoryA = "770e8400-e29b-41d4-a716-446655440001";
const categoryB = "770e8400-e29b-41d4-a716-446655440002";
const vehicleA = "770e8400-e29b-41d4-a716-446655440003";
const vehicleB = "770e8400-e29b-41d4-a716-446655440004";

function bootstrap(overrides: Partial<BootstrapData> = {}): BootstrapData {
  return {
    categories: [
      { color: "#123456", icon: "wallet", id: categoryA, name: "Сервис", sortOrder: 0 },
      { color: "#654321", icon: "fuel", id: categoryB, name: "Топливо", sortOrder: 1 }
    ],
    expenses: [],
    receipts: [],
    vehicles: [
      { archived: false, energyUnit: "l", id: vehicleA, name: "Лада", type: "car" },
      { archived: false, energyUnit: "kWh", id: vehicleB, name: "Москвич", type: "car" }
    ],
    ...overrides
  };
}

describe("latestExpenseDefaults", () => {
  it("uses the first category and no vehicle when there are no expenses", () => {
    expect(latestExpenseDefaults(bootstrap())).toEqual({
      categoryId: categoryA,
      vehicleId: ""
    });
  });

  it("reuses the newest backend expense category and vehicle", () => {
    const data = bootstrap({
      expenses: [
        {
          amountKopecks: 2_500,
          categoryId: categoryB,
          categoryName: "Топливо",
          clientMutationId: null,
          id: "770e8400-e29b-41d4-a716-446655440010",
          merchant: null,
          note: null,
          occurredOn: "2026-07-21",
          receiptId: null,
          vehicleId: vehicleB
        }
      ]
    });

    expect(latestExpenseDefaults(data)).toEqual({
      categoryId: categoryB,
      vehicleId: vehicleB
    });
  });

  it.each(["archived", "missing"])("omits an %s latest vehicle", (kind) => {
    const vehicles =
      kind === "archived"
        ? bootstrap().vehicles.map((vehicle) =>
            vehicle.id === vehicleB ? { ...vehicle, archived: true } : vehicle
          )
        : bootstrap().vehicles.filter((vehicle) => vehicle.id !== vehicleB);
    const data = bootstrap({
      expenses: [
        {
          amountKopecks: 2_500,
          categoryId: categoryB,
          categoryName: "Топливо",
          clientMutationId: null,
          id: "770e8400-e29b-41d4-a716-446655440010",
          merchant: null,
          note: null,
          occurredOn: "2026-07-21",
          receiptId: null,
          vehicleId: vehicleB
        }
      ],
      vehicles
    });

    expect(latestExpenseDefaults(data).vehicleId).toBe("");
  });

  it("falls back to the first category when the newest category no longer exists", () => {
    const data = bootstrap({
      expenses: [
        {
          amountKopecks: 2_500,
          categoryId: "770e8400-e29b-41d4-a716-446655440099",
          categoryName: "Удалённая",
          clientMutationId: null,
          id: "770e8400-e29b-41d4-a716-446655440010",
          merchant: null,
          note: null,
          occurredOn: "2026-07-21",
          receiptId: null,
          vehicleId: null
        }
      ]
    });

    expect(latestExpenseDefaults(data).categoryId).toBe(categoryA);
  });
});

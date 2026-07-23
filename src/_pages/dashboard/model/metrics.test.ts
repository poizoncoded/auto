import { describe, expect, it } from "vitest";

import { calculateDashboardMetrics } from "./metrics";

describe("calculateDashboardMetrics", () => {
  it("summarizes costs, categories, distance, and fuel efficiency", () => {
    const metrics = calculateDashboardMetrics([
      {
        amountKopecks: 210000,
        categoryName: "Топливо",
        fuelEntry: { odometerKm: 1000, quantityMilliUnits: 30000, kind: "fuel" },
        occurredOn: "2026-07-01",
        vehicleId: "vehicle-a"
      },
      {
        amountKopecks: 240000,
        categoryName: "Топливо",
        fuelEntry: { odometerKm: 1300, quantityMilliUnits: 20000, kind: "fuel" },
        occurredOn: "2026-07-10",
        vehicleId: "vehicle-a"
      },
      {
        amountKopecks: 50000,
        categoryName: "Обслуживание",
        occurredOn: "2026-07-12",
        vehicleId: "vehicle-a"
      }
    ]);

    expect(metrics).toEqual({
      categoryTotals: [
        { amountKopecks: 450000, categoryName: "Топливо" },
        { amountKopecks: 50000, categoryName: "Обслуживание" }
      ],
      costPerKmKopecks: 1667,
      distanceKm: 300,
      fuelEfficiencyPer100Km: 6.67,
      totalKopecks: 500000
    });
  });

  it("adds independent distances for multiple vehicles without phantom kilometres", () => {
    const metrics = calculateDashboardMetrics([
      {
        amountKopecks: 10_000,
        categoryName: "Топливо",
        fuelEntry: { kind: "fuel", odometerKm: 1_000, quantityMilliUnits: 30_000 },
        occurredOn: "2026-07-01",
        vehicleId: "vehicle-a"
      },
      {
        amountKopecks: 10_000,
        categoryName: "Топливо",
        fuelEntry: { kind: "fuel", odometerKm: 1_100, quantityMilliUnits: 8_000 },
        occurredOn: "2026-07-02",
        vehicleId: "vehicle-a"
      },
      {
        amountKopecks: 10_000,
        categoryName: "Топливо",
        fuelEntry: { kind: "fuel", odometerKm: 10_000, quantityMilliUnits: 40_000 },
        occurredOn: "2026-07-01",
        vehicleId: "vehicle-b"
      },
      {
        amountKopecks: 10_000,
        categoryName: "Топливо",
        fuelEntry: { kind: "fuel", odometerKm: 10_100, quantityMilliUnits: 10_000 },
        occurredOn: "2026-07-02",
        vehicleId: "vehicle-b"
      }
    ]);

    expect(metrics.distanceKm).toBe(200);
    expect(metrics.fuelEfficiencyPer100Km).toBe(9);
    expect(metrics.costPerKmKopecks).toBe(200);
  });

  it("groups fuel and charging intervals independently", () => {
    const metrics = calculateDashboardMetrics([
      {
        amountKopecks: 10_000,
        categoryName: "Энергия",
        fuelEntry: { kind: "fuel", odometerKm: 100, quantityMilliUnits: 20_000 },
        occurredOn: "2026-07-01",
        vehicleId: "hybrid"
      },
      {
        amountKopecks: 10_000,
        categoryName: "Энергия",
        fuelEntry: { kind: "fuel", odometerKm: 200, quantityMilliUnits: 10_000 },
        occurredOn: "2026-07-02",
        vehicleId: "hybrid"
      },
      {
        amountKopecks: 10_000,
        categoryName: "Энергия",
        fuelEntry: { kind: "charging", odometerKm: 1_000, quantityMilliUnits: 30_000 },
        occurredOn: "2026-07-03",
        vehicleId: "hybrid"
      },
      {
        amountKopecks: 10_000,
        categoryName: "Энергия",
        fuelEntry: { kind: "charging", odometerKm: 1_100, quantityMilliUnits: 20_000 },
        occurredOn: "2026-07-04",
        vehicleId: "hybrid"
      }
    ]);

    expect(metrics.distanceKm).toBe(200);
    expect(metrics.fuelEfficiencyPer100Km).toBe(10);
    expect(metrics.energyEfficiencyPer100Km).toBe(20);
  });

  it("excludes unassigned entries from distance and efficiency", () => {
    const metrics = calculateDashboardMetrics([
      {
        amountKopecks: 10_000,
        categoryName: "Топливо",
        fuelEntry: { kind: "fuel", odometerKm: 1, quantityMilliUnits: 100_000 },
        occurredOn: "2026-07-01",
        vehicleId: null
      },
      {
        amountKopecks: 10_000,
        categoryName: "Топливо",
        fuelEntry: { kind: "fuel", odometerKm: 9_999, quantityMilliUnits: 100_000 },
        occurredOn: "2026-07-02",
        vehicleId: null
      },
      {
        amountKopecks: 10_000,
        categoryName: "Топливо",
        fuelEntry: { kind: "fuel", odometerKm: 500, quantityMilliUnits: 20_000 },
        occurredOn: "2026-07-03",
        vehicleId: "vehicle-a"
      },
      {
        amountKopecks: 10_000,
        categoryName: "Топливо",
        fuelEntry: { kind: "fuel", odometerKm: 600, quantityMilliUnits: 5_000 },
        occurredOn: "2026-07-04",
        vehicleId: "vehicle-a"
      }
    ]);

    expect(metrics.distanceKm).toBe(100);
    expect(metrics.fuelEfficiencyPer100Km).toBe(5);
  });
});

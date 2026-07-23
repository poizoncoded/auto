import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Category } from "@/server/database/entities";
import { registerUser } from "@/server/services/auth";
import {
  createExpense,
  createVehicle,
  updateExpense,
  updateVehicle
} from "@/server/services/finance";

import { createDisposableDatabase, type DisposableDatabase } from "./disposable-database";

describe("vehicle energy-kind enforcement", () => {
  let categoryId: string;
  let disposable: DisposableDatabase;
  let electricVehicleId: string;
  let fuelVehicleId: string;
  let userId: string;

  beforeAll(async () => {
    disposable = await createDisposableDatabase("vehicle_energy");
    const user = await registerUser(disposable.database, {
      displayName: "Энергия транспорта",
      pin: "123456"
    });
    userId = user.id;
    categoryId = (
      await disposable.database.getRepository(Category).findOneByOrFail({ userId })
    ).id;
    fuelVehicleId = (
      await createVehicle(disposable.database, userId, {
        energyUnit: "l",
        name: "Бензиновый",
        type: "Автомобиль"
      })
    ).id;
    electricVehicleId = (
      await createVehicle(disposable.database, userId, {
        energyUnit: "kWh",
        name: "Электрический",
        type: "Автомобиль"
      })
    ).id;
  }, 30_000);

  afterAll(async () => {
    await disposable?.dispose();
  });

  it.each([
    ["charging", "fuel"],
    ["fuel", "electric"]
  ] as const)("rejects %s data for an incompatible vehicle", async (kind, vehicleType) => {
    const vehicleId = vehicleType === "fuel" ? fuelVehicleId : electricVehicleId;

    await expect(
      createExpense(disposable.database, userId, {
        amountKopecks: 10_000,
        categoryId,
        clientMutationId: crypto.randomUUID(),
        fuelEntry: {
          kind,
          odometerKm: 100,
          quantityMilliUnits: 10_000
        },
        occurredOn: "2026-07-20",
        vehicleId
      })
    ).rejects.toMatchObject({ code: "VEHICLE_ENERGY_MISMATCH", status: 400 });
  });

  it("rejects moving an existing fuel entry to an electric vehicle", async () => {
    const expense = await createExpense(disposable.database, userId, {
      amountKopecks: 10_000,
      categoryId,
      clientMutationId: crypto.randomUUID(),
      fuelEntry: {
        kind: "fuel",
        odometerKm: 100,
        quantityMilliUnits: 10_000
      },
      occurredOn: "2026-07-20",
      vehicleId: fuelVehicleId
    });

    await expect(
      updateExpense(disposable.database, userId, expense.id, {
        vehicleId: electricVehicleId
      })
    ).rejects.toMatchObject({ code: "VEHICLE_ENERGY_MISMATCH", status: 400 });
  });

  it("allows an unassigned energy entry and excludes enforcement without a vehicle", async () => {
    await expect(
      createExpense(disposable.database, userId, {
        amountKopecks: 10_000,
        categoryId,
        clientMutationId: crypto.randomUUID(),
        fuelEntry: {
          kind: "charging",
          odometerKm: 100,
          quantityMilliUnits: 10_000
        },
        occurredOn: "2026-07-20"
      })
    ).resolves.toMatchObject({ vehicleId: null });
  });

  it("rejects changing a vehicle unit when stored entries would become incompatible", async () => {
    const vehicle = await createVehicle(disposable.database, userId, {
      energyUnit: "l",
      name: "С историей топлива",
      type: "Автомобиль"
    });
    await createExpense(disposable.database, userId, {
      amountKopecks: 10_000,
      categoryId,
      clientMutationId: crypto.randomUUID(),
      fuelEntry: {
        kind: "fuel",
        odometerKm: 100,
        quantityMilliUnits: 10_000
      },
      occurredOn: "2026-07-20",
      vehicleId: vehicle.id
    });

    await expect(
      updateVehicle(disposable.database, userId, vehicle.id, { energyUnit: "kWh" })
    ).rejects.toMatchObject({ code: "VEHICLE_ENERGY_MISMATCH", status: 400 });
  });
});

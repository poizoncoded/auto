import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DataSource } from "typeorm";

import { createDataSource } from "@/server/database/data-source";
import { registerUser } from "@/server/services/auth";
import {
  createCategory,
  createExpense,
  createReceipt,
  createVehicle,
  deleteCategory,
  deleteExpense,
  deleteVehicle,
  getBootstrap,
  reviewReceipt,
  updateCategory,
  updateExpense,
  updateVehicle
} from "@/server/services/finance";

import { createDisposableDatabase, type DisposableDatabase } from "./disposable-database";

describe("PostgreSQL persistence lifecycle", () => {
  let database: DataSource;
  let disposable: DisposableDatabase;

  beforeAll(async () => {
    disposable = await createDisposableDatabase("persistence_lifecycle");
    database = disposable.database;
  }, 30_000);

  afterAll(async () => {
    if (database && database !== disposable?.database && database.isInitialized) {
      await database.destroy();
    }
    await disposable?.dispose();
  });

  it("persists, isolates, updates, and deletes every daily-use record", async () => {
    const owner = await registerUser(database, {
      displayName: "Постоянный профиль",
      pin: "123456"
    });
    const otherUser = await registerUser(database, {
      displayName: "Другой профиль",
      pin: "654321"
    });
    const defaultCategory = (await getBootstrap(database, owner.id)).categories[0]!;
    const category = await createCategory(database, owner.id, {
      color: "#336699",
      icon: "Wrench",
      name: "Тестовая категория",
      sortOrder: 5
    });
    const vehicle = await createVehicle(database, owner.id, {
      energyUnit: "l",
      name: "Тестовый автомобиль",
      type: "Автомобиль"
    });
    const expense = await createExpense(database, owner.id, {
      amountKopecks: 12_345,
      categoryId: category.id,
      clientMutationId: crypto.randomUUID(),
      fuelEntry: {
        kind: "fuel",
        odometerKm: 42_100,
        quantityMilliUnits: 35_500,
        unitPriceKopecks: 5_678
      },
      merchant: "АЗС",
      occurredOn: "2026-07-21",
      vehicleId: vehicle.id
    });
    const receipt = await createReceipt(database, owner.id, {
      rawPayload:
        "t=20260721T1200&s=456.78&fn=9282440301234567&i=12345&fp=9876543210&n=1"
    });

    await expect(
      reviewReceipt(database, otherUser.id, receipt.id, {
        amountKopecks: 45_678,
        categoryId: defaultCategory.id,
        occurredOn: "2026-07-21"
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });

    const receiptExpense = await reviewReceipt(database, owner.id, receipt.id, {
      amountKopecks: 45_678,
      categoryId: defaultCategory.id,
      merchant: "Магазин по чеку",
      occurredOn: "2026-07-21"
    });
    await updateCategory(database, owner.id, category.id, { name: "Обновлённая категория" });
    await updateVehicle(database, owner.id, vehicle.id, { name: "Обновлённый автомобиль" });
    await updateExpense(database, owner.id, expense.id, {
      amountKopecks: 23_456,
      note: "Обновлено на сервере"
    });

    await expect(
      updateCategory(database, otherUser.id, category.id, { name: "Чужое изменение" })
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(
      updateVehicle(database, otherUser.id, vehicle.id, { name: "Чужое изменение" })
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(
      updateExpense(database, otherUser.id, expense.id, { amountKopecks: 1 })
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });

    await database.destroy();
    database = createDataSource(disposable.url);
    await database.initialize();

    const restored = await getBootstrap(database, owner.id);
    const isolated = await getBootstrap(database, otherUser.id);
    expect(restored.categories).toContainEqual(
      expect.objectContaining({ id: category.id, name: "Обновлённая категория" })
    );
    expect(restored.vehicles).toContainEqual(
      expect.objectContaining({ id: vehicle.id, name: "Обновлённый автомобиль" })
    );
    expect(restored.expenses).toContainEqual(
      expect.objectContaining({
        amountKopecks: 23_456,
        fuelEntry: {
          kind: "fuel",
          odometerKm: 42_100,
          quantityMilliUnits: 35_500,
          unitPriceKopecks: 5_678
        },
        id: expense.id,
        note: "Обновлено на сервере"
      })
    );
    expect(restored.expenses).toContainEqual(
      expect.objectContaining({ id: receiptExpense.id, receiptId: receipt.id })
    );
    expect(restored.receipts).toContainEqual(
      expect.objectContaining({ id: receipt.id, status: "reviewed", totalKopecks: 45_678 })
    );
    expect(isolated.expenses).toEqual([]);
    expect(isolated.receipts).toEqual([]);
    expect(isolated.vehicles).toEqual([]);

    await deleteExpense(database, owner.id, expense.id);
    await deleteVehicle(database, owner.id, vehicle.id);
    await deleteCategory(database, owner.id, category.id);

    await database.destroy();
    database = createDataSource(disposable.url);
    await database.initialize();

    const afterDelete = await getBootstrap(database, owner.id);
    expect(afterDelete.expenses.map((record) => record.id)).not.toContain(expense.id);
    expect(afterDelete.vehicles.map((record) => record.id)).not.toContain(vehicle.id);
    expect(afterDelete.categories.map((record) => record.id)).not.toContain(category.id);
    expect(afterDelete.expenses.map((record) => record.id)).toContain(receiptExpense.id);
  });
});

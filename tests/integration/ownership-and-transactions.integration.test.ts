import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Category, Expense, Session } from "@/server/database/entities";
import { hashSessionToken } from "@/server/security/session";
import {
  createSession,
  destroySession,
  getSessionUserId
} from "@/server/security/session-store";
import { registerUser } from "@/server/services/auth";
import { exportExpensesCsv } from "@/server/services/export";
import {
  createExpense,
  createVehicle,
  deleteExpense,
  getBootstrap
} from "@/server/services/finance";

import { createDisposableDatabase, type DisposableDatabase } from "./disposable-database";

describe("ownership, isolation, transactions, and sessions", () => {
  let categoryA: Category;
  let categoryB: Category;
  let disposable: DisposableDatabase;
  let expenseA: Expense;
  let expenseB: Expense;
  let userAId: string;
  let userBId: string;
  let vehicleAId: string;
  let vehicleBId: string;

  beforeAll(async () => {
    disposable = await createDisposableDatabase("ownership");
    const userA = await registerUser(disposable.database, {
      displayName: "Владелец А",
      pin: "123456"
    });
    const userB = await registerUser(disposable.database, {
      displayName: "Владелец Б",
      pin: "654321"
    });
    userAId = userA.id;
    userBId = userB.id;
    categoryA = await disposable.database.getRepository(Category).findOneByOrFail({
      userId: userAId
    });
    categoryB = await disposable.database.getRepository(Category).findOneByOrFail({
      userId: userBId
    });
    vehicleAId = (
      await createVehicle(disposable.database, userAId, {
        energyUnit: "l",
        name: "Автомобиль А",
        type: "Автомобиль"
      })
    ).id;
    vehicleBId = (
      await createVehicle(disposable.database, userBId, {
        energyUnit: "l",
        name: "Автомобиль Б",
        type: "Автомобиль"
      })
    ).id;
    const createdA = await createExpense(disposable.database, userAId, {
      amountKopecks: 10_000,
      categoryId: categoryA.id,
      clientMutationId: crypto.randomUUID(),
      merchant: "Магазин владельца А",
      occurredOn: "2026-07-20",
      vehicleId: vehicleAId
    });
    const createdB = await createExpense(disposable.database, userBId, {
      amountKopecks: 20_000,
      categoryId: categoryB.id,
      clientMutationId: crypto.randomUUID(),
      merchant: "Магазин владельца Б",
      occurredOn: "2026-07-20",
      vehicleId: vehicleBId
    });
    expenseA = await disposable.database.getRepository(Expense).findOneByOrFail({
      id: createdA.id
    });
    expenseB = await disposable.database.getRepository(Expense).findOneByOrFail({
      id: createdB.id
    });
  }, 30_000);

  afterAll(async () => {
    await disposable?.dispose();
  });

  it("rejects category, vehicle, and expense IDs owned by another user", async () => {
    await expect(
      createExpense(disposable.database, userAId, {
        amountKopecks: 30_000,
        categoryId: categoryB.id,
        clientMutationId: crypto.randomUUID(),
        occurredOn: "2026-07-20"
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(
      createExpense(disposable.database, userAId, {
        amountKopecks: 30_000,
        categoryId: categoryA.id,
        clientMutationId: crypto.randomUUID(),
        occurredOn: "2026-07-20",
        vehicleId: vehicleBId
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(deleteExpense(disposable.database, userAId, expenseB.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404
    });
    await expect(
      disposable.database.getRepository(Expense).existsBy({ id: expenseB.id, userId: userBId })
    ).resolves.toBe(true);
  });

  it("isolates bootstrap, CSV, and JSON-shaped export data by user", async () => {
    const bootstrap = await getBootstrap(disposable.database, userAId);
    const csv = await exportExpensesCsv(bootstrap);
    const json = JSON.stringify(bootstrap);

    expect(bootstrap.expenses.map((expense) => expense.id)).toEqual([expenseA.id]);
    expect(bootstrap.vehicles.map((vehicle) => vehicle.id)).toEqual([vehicleAId]);
    expect(csv).toContain("Магазин владельца А");
    expect(csv).not.toContain("Магазин владельца Б");
    expect(json).toContain(expenseA.id);
    expect(json).not.toContain(expenseB.id);
    expect(json).not.toContain(vehicleBId);
  });

  it("rolls back the expense when a dependent energy row violates a constraint", async () => {
    const before = await disposable.database.getRepository(Expense).countBy({ userId: userAId });

    await expect(
      createExpense(disposable.database, userAId, {
        amountKopecks: 40_000,
        categoryId: categoryA.id,
        clientMutationId: crypto.randomUUID(),
        fuelEntry: {
          kind: "fuel",
          odometerKm: 1_000,
          quantityMilliUnits: 0
        },
        occurredOn: "2026-07-20",
        vehicleId: vehicleAId
      })
    ).rejects.toMatchObject({ code: "23514" });

    await expect(
      disposable.database.getRepository(Expense).countBy({ userId: userAId })
    ).resolves.toBe(before);
  });

  it("expires stale sessions and revokes active sessions", async () => {
    const expiredToken = "expired-session-token";
    const expired = await disposable.database.getRepository(Session).save({
      expiresAt: new Date("2026-07-19T00:00:00Z"),
      tokenHash: hashSessionToken(expiredToken),
      userId: userAId
    });

    await expect(getSessionUserId(disposable.database, expiredToken)).resolves.toBeNull();
    await expect(
      disposable.database.getRepository(Session).existsBy({ id: expired.id })
    ).resolves.toBe(false);

    const active = await createSession(disposable.database, userAId);
    await expect(getSessionUserId(disposable.database, active.token)).resolves.toBe(userAId);
    await destroySession(disposable.database, active.token);
    await expect(getSessionUserId(disposable.database, active.token)).resolves.toBeNull();
  });
});

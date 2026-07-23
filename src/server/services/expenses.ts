import type { DataSource, EntityManager } from "typeorm";

import {
  Category,
  Expense,
  FuelEntry,
  type FuelEntryKind,
  Vehicle
} from "@/server/database/entities";
import { AppError } from "@/server/http/error";
import type { CreateExpenseInput, UpdateExpenseInput } from "@/server/http/schemas";
import type { ExpenseRecord } from "@/shared/api/auto";

import { toExpenseRecord } from "./finance-records";

function notFound(message: string): AppError {
  return new AppError(message, "NOT_FOUND", 404);
}

function vehicleEnergyMismatch(): AppError {
  return new AppError(
    "Тип записи не соответствует источнику энергии транспорта",
    "VEHICLE_ENERGY_MISMATCH",
    400
  );
}

function isMutationIdConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const direct = error as { code?: string; constraint?: string; driverError?: unknown };
  const driver =
    typeof direct.driverError === "object" && direct.driverError !== null
      ? (direct.driverError as { code?: string; constraint?: string })
      : undefined;

  return (
    (direct.code ?? driver?.code) === "23505" &&
    (direct.constraint ?? driver?.constraint) === "expenses_user_client_mutation_id_uidx"
  );
}

async function assertOwnedCategory(
  manager: EntityManager,
  userId: string,
  categoryId: string
): Promise<void> {
  const category = await manager.findOneBy(Category, { id: categoryId, userId });

  if (!category) {
    throw notFound("Категория недоступна");
  }
}

async function getOwnedVehicle(
  manager: EntityManager,
  userId: string,
  vehicleId: string | null | undefined
): Promise<Vehicle | null> {
  if (!vehicleId) {
    return null;
  }

  const vehicle = await manager.findOne(Vehicle, {
    lock: { mode: "pessimistic_read" },
    where: { id: vehicleId, userId }
  });

  if (!vehicle) {
    throw notFound("Транспорт недоступен");
  }

  return vehicle;
}

function assertVehicleEnergyKind(
  vehicle: Vehicle | null,
  fuelEntry: { kind: FuelEntryKind } | null | undefined
): void {
  if (!vehicle || !fuelEntry) {
    return;
  }

  const expectedKind: FuelEntryKind = vehicle.energyUnit === "kWh" ? "charging" : "fuel";

  if (fuelEntry.kind !== expectedKind) {
    throw vehicleEnergyMismatch();
  }
}

export async function createExpenseWithManager(
  manager: EntityManager,
  userId: string,
  input: Omit<CreateExpenseInput, "clientMutationId"> & { clientMutationId?: string },
  receiptId: string | null = null
): Promise<ExpenseRecord> {
  const [, vehicle] = await Promise.all([
    assertOwnedCategory(manager, userId, input.categoryId),
    getOwnedVehicle(manager, userId, input.vehicleId)
  ]);
  assertVehicleEnergyKind(vehicle, input.fuelEntry);

  const expense = await manager.save(
    manager.create(Expense, {
      amountKopecks: input.amountKopecks,
      categoryId: input.categoryId,
      clientMutationId: input.clientMutationId ?? null,
      merchant: input.merchant || null,
      note: input.note || null,
      occurredOn: input.occurredOn,
      receiptId,
      userId,
      vehicleId: input.vehicleId ?? null
    })
  );

  const fuelEntry = input.fuelEntry
    ? await manager.save(
        manager.create(FuelEntry, {
          expenseId: expense.id,
          kind: input.fuelEntry.kind,
          odometerKm: input.fuelEntry.odometerKm,
          quantityMilliUnits: input.fuelEntry.quantityMilliUnits,
          unitPriceKopecks: input.fuelEntry.unitPriceKopecks ?? null,
          userId
        })
      )
    : undefined;
  const category = await manager.findOneByOrFail(Category, { id: expense.categoryId, userId });

  return toExpenseRecord(expense, category, fuelEntry);
}

export async function createExpense(
  database: DataSource,
  userId: string,
  input: CreateExpenseInput
): Promise<ExpenseRecord> {
  const findExisting = async (): Promise<ExpenseRecord | null> => {
    const expense = await database.getRepository(Expense).findOneBy({
      clientMutationId: input.clientMutationId,
      userId
    });

    if (!expense) {
      return null;
    }

    const [category, fuelEntry] = await Promise.all([
      database.getRepository(Category).findOneByOrFail({ id: expense.categoryId, userId }),
      database.getRepository(FuelEntry).findOneBy({ expenseId: expense.id, userId })
    ]);
    return toExpenseRecord(expense, category, fuelEntry);
  };
  const existing = await findExisting();

  if (existing) {
    return existing;
  }

  try {
    return await database.transaction((manager) => createExpenseWithManager(manager, userId, input));
  } catch (error) {
    if (isMutationIdConflict(error)) {
      const racedExpense = await findExisting();

      if (racedExpense) {
        return racedExpense;
      }
    }

    throw error;
  }
}

export async function deleteExpense(
  database: DataSource,
  userId: string,
  expenseId: string
): Promise<void> {
  const result = await database.getRepository(Expense).delete({ id: expenseId, userId });

  if (!result.affected) {
    throw notFound("Расход недоступен");
  }
}

export async function updateExpense(
  database: DataSource,
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput
): Promise<ExpenseRecord> {
  return database.transaction(async (manager) => {
    const expense = await manager.findOneBy(Expense, { id: expenseId, userId });

    if (!expense) {
      throw notFound("Расход недоступен");
    }

    if (input.categoryId) {
      await assertOwnedCategory(manager, userId, input.categoryId);
    }

    const effectiveVehicleId = input.vehicleId === undefined ? expense.vehicleId : input.vehicleId;
    const [vehicle, existingFuelEntry] = await Promise.all([
      getOwnedVehicle(manager, userId, effectiveVehicleId),
      manager.findOneBy(FuelEntry, { expenseId: expense.id, userId })
    ]);
    const effectiveFuelEntry = input.fuelEntry === undefined ? existingFuelEntry : input.fuelEntry;
    assertVehicleEnergyKind(vehicle, effectiveFuelEntry);

    const { fuelEntry, merchant, note, ...values } = input;
    Object.assign(expense, values);

    if (merchant !== undefined) {
      expense.merchant = merchant || null;
    }

    if (note !== undefined) {
      expense.note = note || null;
    }

    const savedExpense = await manager.save(expense);
    let savedFuelEntry = existingFuelEntry;

    if (fuelEntry === null && savedFuelEntry) {
      await manager.delete(FuelEntry, { expenseId: savedExpense.id, userId });
      savedFuelEntry = null;
    } else if (fuelEntry) {
      savedFuelEntry = await manager.save(
        manager.create(FuelEntry, {
          ...savedFuelEntry,
          expenseId: savedExpense.id,
          kind: fuelEntry.kind,
          odometerKm: fuelEntry.odometerKm,
          quantityMilliUnits: fuelEntry.quantityMilliUnits,
          unitPriceKopecks: fuelEntry.unitPriceKopecks ?? null,
          userId
        })
      );
    }

    const category = await manager.findOneByOrFail(Category, { id: savedExpense.categoryId, userId });
    return toExpenseRecord(savedExpense, category, savedFuelEntry);
  });
}

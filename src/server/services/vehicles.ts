import type { DataSource } from "typeorm";

import { Vehicle, type FuelEntryKind } from "@/server/database/entities";
import { AppError } from "@/server/http/error";
import type { CreateVehicleInput } from "@/server/http/schemas";
import type { VehicleRecord } from "@/shared/api/auto";

import { toVehicleRecord } from "./finance-records";

function notFound(): AppError {
  return new AppError("Транспорт недоступен", "NOT_FOUND", 404);
}

export async function createVehicle(
  database: DataSource,
  userId: string,
  input: CreateVehicleInput
): Promise<VehicleRecord> {
  const vehicle = await database.getRepository(Vehicle).save({
    ...input,
    currency: "RUB",
    odometerUnit: "km",
    userId
  });

  return toVehicleRecord(vehicle);
}

export async function updateVehicle(
  database: DataSource,
  userId: string,
  vehicleId: string,
  input: Partial<CreateVehicleInput> & { archived?: boolean }
): Promise<VehicleRecord> {
  return database.transaction(async (manager) => {
    const repository = manager.getRepository(Vehicle);
    const vehicle = await repository.findOne({
      lock: { mode: "pessimistic_write" },
      where: { id: vehicleId, userId }
    });

    if (!vehicle) {
      throw notFound();
    }

    if (input.energyUnit && input.energyUnit !== vehicle.energyUnit) {
      const incompatibleKind: FuelEntryKind = input.energyUnit === "kWh" ? "fuel" : "charging";
      const rows = (await manager.query(
        `
          SELECT EXISTS (
            SELECT 1
            FROM fuel_entries AS fuel_entry
            INNER JOIN expenses AS expense ON expense.id = fuel_entry.expense_id
            WHERE fuel_entry.user_id = $1
              AND expense.user_id = $1
              AND expense.vehicle_id = $2
              AND fuel_entry.kind = $3
          ) AS exists
        `,
        [userId, vehicleId, incompatibleKind]
      )) as Array<{ exists: boolean }>;

      if (rows[0]?.exists) {
        throw new AppError(
          "Тип записи не соответствует источнику энергии транспорта",
          "VEHICLE_ENERGY_MISMATCH",
          400
        );
      }
    }

    Object.assign(vehicle, input);
    return toVehicleRecord(await repository.save(vehicle));
  });
}

export async function deleteVehicle(
  database: DataSource,
  userId: string,
  vehicleId: string
): Promise<void> {
  const result = await database.getRepository(Vehicle).delete({ id: vehicleId, userId });

  if (!result.affected) {
    throw notFound();
  }
}

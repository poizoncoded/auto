import type { Category, Expense, FuelEntry, Receipt, Vehicle } from "@/server/database/entities";
import type {
  CategoryRecord,
  ExpenseRecord,
  ReceiptRecord,
  VehicleRecord
} from "@/shared/api/auto";

export function toExpenseRecord(
  expense: Expense,
  category: Category,
  fuelEntry?: FuelEntry | null
): ExpenseRecord {
  return {
    amountKopecks: expense.amountKopecks,
    categoryId: expense.categoryId,
    categoryName: category.name,
    clientMutationId: expense.clientMutationId,
    ...(fuelEntry
      ? {
          fuelEntry: {
            kind: fuelEntry.kind,
            odometerKm: fuelEntry.odometerKm,
            quantityMilliUnits: fuelEntry.quantityMilliUnits,
            unitPriceKopecks: fuelEntry.unitPriceKopecks
          }
        }
      : {}),
    id: expense.id,
    merchant: expense.merchant,
    note: expense.note,
    occurredOn: expense.occurredOn,
    receiptId: expense.receiptId,
    vehicleId: expense.vehicleId
  };
}

export function toVehicleRecord(vehicle: Vehicle): VehicleRecord {
  return {
    archived: vehicle.archived,
    energyUnit: vehicle.energyUnit === "kWh" ? "kWh" : "l",
    id: vehicle.id,
    name: vehicle.name,
    type: vehicle.type
  };
}

export function toCategoryRecord(category: Category): CategoryRecord {
  return {
    color: category.color,
    icon: category.icon,
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder
  };
}

export function toReceiptRecord(receipt: Receipt): ReceiptRecord {
  return {
    fiscalDocumentNumber: receipt.fiscalDocumentNumber,
    fiscalDriveNumber: receipt.fiscalDriveNumber,
    fiscalSign: receipt.fiscalSign,
    id: receipt.id,
    issuedAt: receipt.issuedAt?.toISOString().slice(0, 16) ?? null,
    status: receipt.status,
    totalKopecks: receipt.totalKopecks
  };
}

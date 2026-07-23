import type { DataSource } from "typeorm";

import { Category, Expense, FuelEntry, Receipt, Vehicle } from "@/server/database/entities";
import type { BootstrapData } from "@/shared/api/auto";

import {
  toCategoryRecord,
  toExpenseRecord,
  toReceiptRecord,
  toVehicleRecord
} from "./finance-records";

export async function getBootstrap(database: DataSource, userId: string): Promise<BootstrapData> {
  const [vehicles, categories, expenses, fuelEntries, receipts] = await Promise.all([
    database.getRepository(Vehicle).find({ where: { userId }, order: { createdAt: "ASC" } }),
    database.getRepository(Category).find({ where: { userId }, order: { sortOrder: "ASC", name: "ASC" } }),
    database.getRepository(Expense).find({ where: { userId }, order: { occurredOn: "DESC", createdAt: "DESC" } }),
    database.getRepository(FuelEntry).find({ where: { userId } }),
    database.getRepository(Receipt).find({ where: { userId }, order: { createdAt: "DESC" } })
  ]);
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const fuelEntriesByExpense = new Map(fuelEntries.map((entry) => [entry.expenseId, entry]));

  return {
    categories: categories.map(toCategoryRecord),
    expenses: expenses.map((expense) => {
      const category = categoriesById.get(expense.categoryId) ?? Object.assign(new Category(), { name: "Категория" });
      return toExpenseRecord(expense, category, fuelEntriesByExpense.get(expense.id));
    }),
    receipts: receipts.map(toReceiptRecord),
    vehicles: vehicles.map(toVehicleRecord)
  };
}

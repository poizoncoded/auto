import type { BootstrapData } from "@/shared/api/auto";

export interface ExpenseDefaults {
  categoryId: string;
  vehicleId: string;
}

export function latestExpenseDefaults(data: BootstrapData): ExpenseDefaults {
  const latestExpense = data.expenses[0];
  const categoryId = data.categories.some((category) => category.id === latestExpense?.categoryId)
    ? (latestExpense?.categoryId ?? "")
    : (data.categories[0]?.id ?? "");
  const vehicleId = data.vehicles.some(
    (vehicle) => vehicle.id === latestExpense?.vehicleId && !vehicle.archived
  )
    ? (latestExpense?.vehicleId ?? "")
    : "";

  return { categoryId, vehicleId };
}

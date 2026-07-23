export type EnergyEntryKind = "charging" | "fuel";

export interface DashboardExpense {
  amountKopecks: number;
  categoryName: string;
  fuelEntry?: {
    kind: EnergyEntryKind;
    odometerKm: number;
    quantityMilliUnits: number;
  };
  occurredOn: string;
  vehicleId: string | null;
}

export interface DashboardMetrics {
  categoryTotals: Array<{ amountKopecks: number; categoryName: string }>;
  costPerKmKopecks: number | null;
  distanceKm: number;
  energyEfficiencyPer100Km?: number;
  fuelEfficiencyPer100Km?: number;
  totalKopecks: number;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

type EnergyExpense = DashboardExpense & {
  fuelEntry: NonNullable<DashboardExpense["fuelEntry"]>;
  vehicleId: string;
};

function groupedEnergyEntries(entries: DashboardExpense[]): EnergyExpense[][] {
  const groups = new Map<string, EnergyExpense[]>();

  for (const expense of entries) {
    if (!expense.fuelEntry || !expense.vehicleId) {
      continue;
    }

    const key = `${expense.vehicleId}:${expense.fuelEntry.kind}`;
    const group = groups.get(key) ?? [];
    group.push(expense as EnergyExpense);
    groups.set(key, group);
  }

  return [...groups.values()];
}

function groupDistance(entries: EnergyExpense[]): number {
  if (entries.length < 2) {
    return 0;
  }

  const odometers = entries.map((expense) => expense.fuelEntry.odometerKm);
  return Math.max(0, Math.max(...odometers) - Math.min(...odometers));
}

function calculateDistance(groups: EnergyExpense[][]): number {
  return groups.reduce((total, entries) => total + groupDistance(entries), 0);
}

function calculateEfficiency(
  groups: EnergyExpense[][],
  kind: EnergyEntryKind
): number | undefined {
  const matchingGroups = groups.filter((entries) => entries[0]?.fuelEntry.kind === kind);
  const distanceKm = calculateDistance(matchingGroups);

  if (distanceKm <= 0) {
    return undefined;
  }

  const consumedMilliUnits = matchingGroups.reduce((total, entries) => {
    const ordered = entries.toSorted((left, right) => {
      const dateOrder = left.occurredOn.localeCompare(right.occurredOn);
      return dateOrder || left.fuelEntry.odometerKm - right.fuelEntry.odometerKm;
    });

    return (
      total +
      ordered
        .slice(1)
        .reduce((groupTotal, expense) => groupTotal + expense.fuelEntry.quantityMilliUnits, 0)
    );
  }, 0);

  return roundToTwo((consumedMilliUnits / 1000 / distanceKm) * 100);
}

export function calculateDashboardMetrics(expenses: DashboardExpense[]): DashboardMetrics {
  const categoryTotals = new Map<string, number>();
  let totalKopecks = 0;

  for (const expense of expenses) {
    totalKopecks += expense.amountKopecks;
    categoryTotals.set(
      expense.categoryName,
      (categoryTotals.get(expense.categoryName) ?? 0) + expense.amountKopecks
    );
  }

  const energyGroups = groupedEnergyEntries(expenses);
  const distanceKm = calculateDistance(energyGroups);
  const fuelEfficiencyPer100Km = calculateEfficiency(energyGroups, "fuel");
  const energyEfficiencyPer100Km = calculateEfficiency(energyGroups, "charging");

  return {
    categoryTotals: [...categoryTotals.entries()]
      .map(([categoryName, amountKopecks]) => ({ amountKopecks, categoryName }))
      .toSorted((left, right) => right.amountKopecks - left.amountKopecks),
    costPerKmKopecks: distanceKm > 0 ? Math.round(totalKopecks / distanceKm) : null,
    distanceKm,
    ...(energyEfficiencyPer100Km === undefined ? {} : { energyEfficiencyPer100Km }),
    ...(fuelEfficiencyPer100Km === undefined ? {} : { fuelEfficiencyPer100Km }),
    totalKopecks
  };
}

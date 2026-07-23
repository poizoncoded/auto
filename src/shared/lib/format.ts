const rubleFormatter = new Intl.NumberFormat("ru-RU", {
  currency: "RUB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency"
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

export function formatRuble(kopecks: number): string {
  return rubleFormatter.format(kopecks / 100);
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

export function formatQuantity(quantityMilliUnits: number, unit: "kWh" | "l"): string {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(
    quantityMilliUnits / 1000
  )} ${unit}`;
}

export function toKopecks(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export function kopecksToInput(kopecks: number): string {
  return (kopecks / 100).toFixed(2).replace(".", ",");
}

export function todayLocalDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

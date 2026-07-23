export type FuelEntryKind = "charging" | "fuel";

export interface PublicUser {
  displayName: string;
  id: string;
}

export interface VehicleRecord {
  archived: boolean;
  energyUnit: "kWh" | "l";
  id: string;
  name: string;
  type: string;
}

export interface CategoryRecord {
  color: string;
  icon: string;
  id: string;
  name: string;
  sortOrder: number;
}

export interface FuelEntryRecord {
  kind: FuelEntryKind;
  odometerKm: number;
  quantityMilliUnits: number;
  unitPriceKopecks: number | null;
}

export interface ExpenseRecord {
  amountKopecks: number;
  categoryId: string;
  categoryName: string;
  clientMutationId: string | null;
  fuelEntry?: FuelEntryRecord;
  id: string;
  merchant: string | null;
  note: string | null;
  occurredOn: string;
  receiptId: string | null;
  vehicleId: string | null;
}

export interface ReceiptRecord {
  fiscalDocumentNumber: string | null;
  fiscalDriveNumber: string | null;
  fiscalSign: string | null;
  id: string;
  issuedAt: string | null;
  status: "pending" | "reviewed";
  totalKopecks: number | null;
}

export interface BootstrapData {
  categories: CategoryRecord[];
  expenses: ExpenseRecord[];
  receipts: ReceiptRecord[];
  vehicles: VehicleRecord[];
}

export interface ExpenseInput {
  amountKopecks: number;
  categoryId: string;
  fuelEntry?: {
    kind: FuelEntryKind;
    odometerKm: number;
    quantityMilliUnits: number;
    unitPriceKopecks?: number;
  } | null;
  merchant?: string;
  note?: string;
  occurredOn: string;
  vehicleId?: string | null;
}

export interface VehicleInput {
  energyUnit: "kWh" | "l";
  name: string;
  type: string;
}

export interface CategoryInput {
  color: string;
  icon: string;
  name: string;
  sortOrder?: number;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = "REQUEST_FAILED",
    readonly fields: Record<string, string> = {}
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface JsonRequestOptions {
  body?: unknown;
  method?: "DELETE" | "GET" | "PATCH" | "POST";
}

interface ErrorPayload {
  error?: {
    code?: string;
    fields?: Record<string, unknown>;
    message?: string;
  };
}

function stringFields(value: Record<string, unknown> | undefined): Record<string, string> {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

export async function requestJson<T>(
  path: string,
  { body, method = "GET" }: JsonRequestOptions = {}
): Promise<T> {
  const sendsJson = body !== undefined || method !== "GET";
  const response = await fetch(path, {
    body: sendsJson ? JSON.stringify(body ?? {}) : undefined,
    credentials: "same-origin",
    headers: sendsJson ? { "content-type": "application/json" } : undefined,
    method
  });
  const payload = (await response.json().catch(() => null)) as T | ErrorPayload | null;

  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as ErrorPayload).error
        : undefined;
    throw new ApiRequestError(
      error?.message ?? "Не удалось выполнить запрос",
      response.status,
      error?.code ?? "REQUEST_FAILED",
      stringFields(error?.fields)
    );
  }

  return payload as T;
}

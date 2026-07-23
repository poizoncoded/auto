import { EntitySchema } from "typeorm";

export type FuelEntryKind = "charging" | "fuel";
export type ReceiptStatus = "pending" | "reviewed";

export class User {
  id!: string;
  displayName!: string;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class PinCredential {
  id!: string;
  userId!: string;
  credential!: string;
  changedAt!: Date;
}

export class Session {
  id!: string;
  userId!: string;
  tokenHash!: string;
  expiresAt!: Date;
  createdAt!: Date;
}

export class AuthAttempt {
  id!: string;
  operation!: string;
  scopeHash!: string;
  attemptCount!: number;
  windowStartedAt!: Date;
  blockedUntil!: Date | null;
  expiresAt!: Date;
  updatedAt!: Date;
}

export class Vehicle {
  id!: string;
  userId!: string;
  name!: string;
  type!: string;
  energyUnit!: string;
  odometerUnit!: string;
  currency!: string;
  archived!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class Category {
  id!: string;
  userId!: string;
  name!: string;
  icon!: string;
  color!: string;
  kind!: string;
  sortOrder!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ReceiptProvider {
  key!: string;
  displayName!: string;
  enabled!: boolean;
  supportedFields!: string[];
  updatedAt!: Date;
}

export class Receipt {
  id!: string;
  userId!: string;
  decodedPayload!: string;
  providerKey!: string | null;
  fiscalDriveNumber!: string | null;
  fiscalDocumentNumber!: string | null;
  fiscalSign!: string | null;
  operationType!: string | null;
  issuedAt!: Date | null;
  totalKopecks!: number | null;
  status!: ReceiptStatus;
  rawMetadata!: Record<string, unknown>;
  reviewedAt!: Date | null;
  createdAt!: Date;
}

export class Expense {
  id!: string;
  userId!: string;
  vehicleId!: string | null;
  categoryId!: string;
  clientMutationId!: string | null;
  receiptId!: string | null;
  amountKopecks!: number;
  occurredOn!: string;
  merchant!: string | null;
  note!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class FuelEntry {
  id!: string;
  expenseId!: string;
  userId!: string;
  kind!: FuelEntryKind;
  odometerKm!: number;
  quantityMilliUnits!: number;
  unitPriceKopecks!: number | null;
}

export class ReceiptItem {
  id!: string;
  receiptId!: string;
  name!: string;
  quantityMilliUnits!: number;
  totalKopecks!: number;
}

export const UserSchema = new EntitySchema<User>({
  columns: {
    createdAt: { createDate: true, name: "created_at", type: "timestamptz" },
    displayName: { length: 80, name: "display_name", type: "varchar" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    status: { default: "active", length: 24, type: "varchar" },
    updatedAt: { name: "updated_at", type: "timestamptz", updateDate: true }
  },
  indices: [{ columns: ["displayName"], unique: true }],
  name: "User",
  tableName: "users",
  target: User
});

export const PinCredentialSchema = new EntitySchema<PinCredential>({
  columns: {
    changedAt: { name: "changed_at", type: "timestamptz", updateDate: true },
    credential: { type: "text" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    userId: { name: "user_id", type: "uuid" }
  },
  indices: [{ columns: ["userId"], unique: true }],
  name: "PinCredential",
  tableName: "pin_credentials",
  target: PinCredential
});

export const SessionSchema = new EntitySchema<Session>({
  columns: {
    createdAt: { createDate: true, name: "created_at", type: "timestamptz" },
    expiresAt: { name: "expires_at", type: "timestamptz" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    tokenHash: { length: 64, name: "token_hash", type: "char" },
    userId: { name: "user_id", type: "uuid" }
  },
  indices: [{ columns: ["userId"] }, { columns: ["tokenHash"], unique: true }],
  name: "Session",
  tableName: "sessions",
  target: Session
});

export const AuthAttemptSchema = new EntitySchema<AuthAttempt>({
  columns: {
    attemptCount: { name: "attempt_count", type: "integer" },
    blockedUntil: { name: "blocked_until", nullable: true, type: "timestamptz" },
    expiresAt: { name: "expires_at", type: "timestamptz" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    operation: { length: 16, type: "varchar" },
    scopeHash: { length: 64, name: "scope_hash", type: "char" },
    updatedAt: { name: "updated_at", type: "timestamptz", updateDate: true },
    windowStartedAt: { name: "window_started_at", type: "timestamptz" }
  },
  indices: [
    { columns: ["operation", "scopeHash"], unique: true },
    { columns: ["expiresAt"] }
  ],
  name: "AuthAttempt",
  tableName: "auth_attempts",
  target: AuthAttempt
});

export const VehicleSchema = new EntitySchema<Vehicle>({
  columns: {
    archived: { default: false, type: "boolean" },
    createdAt: { createDate: true, name: "created_at", type: "timestamptz" },
    currency: { default: "RUB", length: 3, type: "char" },
    energyUnit: { length: 16, name: "energy_unit", type: "varchar" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    name: { length: 80, type: "varchar" },
    odometerUnit: { default: "km", length: 8, name: "odometer_unit", type: "varchar" },
    type: { length: 32, type: "varchar" },
    updatedAt: { name: "updated_at", type: "timestamptz", updateDate: true },
    userId: { name: "user_id", type: "uuid" }
  },
  indices: [{ columns: ["userId"] }],
  name: "Vehicle",
  tableName: "vehicles",
  target: Vehicle
});

export const CategorySchema = new EntitySchema<Category>({
  columns: {
    color: { length: 7, type: "char" },
    createdAt: { createDate: true, name: "created_at", type: "timestamptz" },
    icon: { length: 32, type: "varchar" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    kind: { default: "expense", length: 16, type: "varchar" },
    name: { length: 60, type: "varchar" },
    sortOrder: { default: 0, name: "sort_order", type: "integer" },
    updatedAt: { name: "updated_at", type: "timestamptz", updateDate: true },
    userId: { name: "user_id", type: "uuid" }
  },
  indices: [{ columns: ["userId"] }],
  name: "Category",
  tableName: "categories",
  target: Category
});

export const ReceiptProviderSchema = new EntitySchema<ReceiptProvider>({
  columns: {
    displayName: { length: 80, name: "display_name", type: "varchar" },
    enabled: { default: true, type: "boolean" },
    key: { length: 64, primary: true, type: "varchar" },
    supportedFields: { name: "supported_fields", type: "jsonb" },
    updatedAt: { name: "updated_at", type: "timestamptz", updateDate: true }
  },
  name: "ReceiptProvider",
  tableName: "receipt_providers",
  target: ReceiptProvider
});

export const ReceiptSchema = new EntitySchema<Receipt>({
  columns: {
    createdAt: { createDate: true, name: "created_at", type: "timestamptz" },
    decodedPayload: { name: "decoded_payload", type: "text" },
    fiscalDocumentNumber: {
      length: 32,
      name: "fiscal_document_number",
      nullable: true,
      type: "varchar"
    },
    fiscalDriveNumber: {
      length: 32,
      name: "fiscal_drive_number",
      nullable: true,
      type: "varchar"
    },
    fiscalSign: { length: 32, name: "fiscal_sign", nullable: true, type: "varchar" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    issuedAt: { name: "issued_at", nullable: true, type: "timestamp" },
    operationType: { length: 16, name: "operation_type", nullable: true, type: "varchar" },
    providerKey: { length: 64, name: "provider_key", nullable: true, type: "varchar" },
    rawMetadata: { name: "raw_metadata", type: "jsonb" },
    reviewedAt: { name: "reviewed_at", nullable: true, type: "timestamptz" },
    status: { default: "pending", length: 16, type: "varchar" },
    totalKopecks: { name: "total_kopecks", nullable: true, type: "integer" },
    userId: { name: "user_id", type: "uuid" }
  },
  indices: [{ columns: ["userId"] }],
  name: "Receipt",
  tableName: "receipts",
  target: Receipt
});

export const ExpenseSchema = new EntitySchema<Expense>({
  columns: {
    amountKopecks: { name: "amount_kopecks", type: "integer" },
    categoryId: { name: "category_id", type: "uuid" },
    clientMutationId: { name: "client_mutation_id", nullable: true, type: "uuid" },
    createdAt: { createDate: true, name: "created_at", type: "timestamptz" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    merchant: { length: 140, nullable: true, type: "varchar" },
    note: { nullable: true, type: "text" },
    occurredOn: { name: "occurred_on", type: "date" },
    receiptId: { name: "receipt_id", nullable: true, type: "uuid" },
    updatedAt: { name: "updated_at", type: "timestamptz", updateDate: true },
    userId: { name: "user_id", type: "uuid" },
    vehicleId: { name: "vehicle_id", nullable: true, type: "uuid" }
  },
  indices: [
    {
      columns: ["userId", "clientMutationId"],
      unique: true,
      where: "\"client_mutation_id\" IS NOT NULL"
    },
    { columns: ["userId"] },
    { columns: ["vehicleId"] },
    { columns: ["categoryId"] },
    { columns: ["receiptId"], unique: true }
  ],
  name: "Expense",
  tableName: "expenses",
  target: Expense
});

export const FuelEntrySchema = new EntitySchema<FuelEntry>({
  columns: {
    expenseId: { name: "expense_id", type: "uuid" },
    id: { generated: "uuid", primary: true, type: "uuid" },
    kind: { length: 16, type: "varchar" },
    odometerKm: { name: "odometer_km", type: "integer" },
    quantityMilliUnits: { name: "quantity_milli_units", type: "integer" },
    unitPriceKopecks: { name: "unit_price_kopecks", nullable: true, type: "integer" },
    userId: { name: "user_id", type: "uuid" }
  },
  indices: [{ columns: ["expenseId"], unique: true }, { columns: ["userId"] }],
  name: "FuelEntry",
  tableName: "fuel_entries",
  target: FuelEntry
});

export const ReceiptItemSchema = new EntitySchema<ReceiptItem>({
  columns: {
    id: { generated: "uuid", primary: true, type: "uuid" },
    name: { type: "varchar" },
    quantityMilliUnits: { default: 1000, name: "quantity_milli_units", type: "integer" },
    receiptId: { name: "receipt_id", type: "uuid" },
    totalKopecks: { name: "total_kopecks", type: "integer" }
  },
  indices: [{ columns: ["receiptId"] }],
  name: "ReceiptItem",
  tableName: "receipt_items",
  target: ReceiptItem
});

export const databaseEntities = [
  UserSchema,
  PinCredentialSchema,
  SessionSchema,
  AuthAttemptSchema,
  VehicleSchema,
  CategorySchema,
  ReceiptProviderSchema,
  ReceiptSchema,
  ExpenseSchema,
  FuelEntrySchema,
  ReceiptItemSchema
] as const;

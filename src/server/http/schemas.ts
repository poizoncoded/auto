import { z } from "zod";

import { maximumAmountKopecks } from "@/shared/lib/amount";
import { isValidIsoLocalDate } from "@/shared/lib/date";

const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine(isValidIsoLocalDate, "Use a real calendar date");
const pinSchema = z.string().regex(/^\d{6}$/, "PIN must contain six digits");
const recordIdSchema = z.uuid();
const amountKopecksSchema = z.number().int().positive().max(maximumAmountKopecks);

export const registerUserSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  pin: pinSchema
});

export const loginSchema = z.object({
  pin: pinSchema,
  userId: recordIdSchema
});

export const changePinSchema = z.object({
  currentPin: pinSchema,
  nextPin: pinSchema
});

export const createVehicleSchema = z.object({
  energyUnit: z.enum(["kWh", "l"]),
  name: z.string().trim().min(1).max(80),
  type: z.enum(["Автомобиль", "Велосипед", "Грузовик", "Мотоцикл", "Самокат", "Другое"])
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  archived: z.boolean().optional()
});

export const createCategorySchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(60),
  sortOrder: z.number().int().min(0).max(999).optional()
});

export const updateCategorySchema = createCategorySchema.partial();

export const fuelEntrySchema = z.object({
  kind: z.enum(["charging", "fuel"]),
  odometerKm: z.number().int().min(0).max(10_000_000),
  quantityMilliUnits: z.number().int().positive().max(10_000_000),
  unitPriceKopecks: z.number().int().min(0).max(10_000_000).optional()
});

const expenseDetailsSchema = z.object({
  amountKopecks: amountKopecksSchema,
  categoryId: recordIdSchema,
  fuelEntry: fuelEntrySchema.optional(),
  merchant: z.string().trim().max(140).optional(),
  note: z.string().trim().max(2000).optional(),
  occurredOn: localDateSchema,
  vehicleId: recordIdSchema.optional()
});

export const createExpenseSchema = expenseDetailsSchema.extend({
  clientMutationId: recordIdSchema
});

export const updateExpenseSchema = expenseDetailsSchema.partial().extend({
  fuelEntry: fuelEntrySchema.nullable().optional(),
  vehicleId: recordIdSchema.nullable().optional()
});

export const createReceiptSchema = z.object({
  rawPayload: z.string().trim().min(1).max(4096)
});

export const reviewReceiptSchema = expenseDetailsSchema.extend({
  merchant: z.string().trim().max(140).optional()
});

export { localDateSchema, recordIdSchema };

export type ChangePinInput = z.infer<typeof changePinSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type ReviewReceiptInput = z.infer<typeof reviewReceiptSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

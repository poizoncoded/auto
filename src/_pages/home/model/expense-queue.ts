import type { ExpenseInput } from "@/shared/api/auto";
import { ApiRequestError } from "@/shared/api/auto";
import { maximumAmountKopecks } from "@/shared/lib/amount";
import { isValidIsoLocalDate } from "@/shared/lib/date";
import { z } from "zod";

export interface ExpenseQueueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type QueuedExpense = ExpenseInput & { clientMutationId: string };

interface ClientMutationCrypto {
  getRandomValues: (values: Uint8Array) => Uint8Array;
  randomUUID?: () => string;
}

const queuedExpenseSchema = z.object({
  amountKopecks: z.number().int().positive().max(maximumAmountKopecks),
  categoryId: z.uuid(),
  clientMutationId: z.uuid(),
  fuelEntry: z
    .object({
      kind: z.enum(["charging", "fuel"]),
      odometerKm: z.number().int().min(0).max(10_000_000),
      quantityMilliUnits: z.number().int().positive().max(10_000_000),
      unitPriceKopecks: z.number().int().min(0).max(10_000_000).optional()
    })
    .nullable()
    .optional(),
  merchant: z.string().max(140).optional(),
  note: z.string().max(2000).optional(),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidIsoLocalDate),
  vehicleId: z.uuid().nullable().optional()
});

function queueKey(userId: string): string {
  return `auto-spendings:queued-expenses:${userId}`;
}

export function createClientMutationId(random: ClientMutationCrypto = globalThis.crypto): string {
  if (typeof random.randomUUID === "function") {
    return random.randomUUID();
  }

  const bytes = random.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export function createExpenseMutation(
  input: ExpenseInput,
  createId: () => string = createClientMutationId
): QueuedExpense {
  return queuedExpenseSchema.parse({ ...input, clientMutationId: createId() });
}

export function loadQueuedExpenses(
  storage: ExpenseQueueStorage,
  userId: string
): QueuedExpense[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(queueKey(userId)) ?? "[]");

    if (!Array.isArray(value)) {
      return [];
    }

    return value.flatMap((record) => {
      const parsed = queuedExpenseSchema.safeParse(record);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

export function saveQueuedExpenses(
  storage: ExpenseQueueStorage,
  userId: string,
  expenses: QueuedExpense[]
): void {
  const validated = expenses.flatMap((record) => {
    const parsed = queuedExpenseSchema.safeParse(record);
    return parsed.success ? [parsed.data] : [];
  });
  storage.setItem(queueKey(userId), JSON.stringify(validated));
}

export function shouldRetryExpense(error: unknown): boolean {
  return !(error instanceof ApiRequestError) || error.status === 429 || error.status >= 500;
}

interface SubmitExpenseOptions {
  createId?: () => string;
  isOnline: boolean;
  queue: (expense: QueuedExpense) => void;
  send: (expense: QueuedExpense) => Promise<void>;
}

export async function submitNewExpense(
  input: ExpenseInput,
  options: SubmitExpenseOptions
): Promise<"queued" | "sent"> {
  const expense = createExpenseMutation(input, options.createId);

  if (!options.isOnline) {
    options.queue(expense);
    return "queued";
  }

  try {
    await options.send(expense);
    return "sent";
  } catch (error) {
    if (!shouldRetryExpense(error)) {
      throw error;
    }

    options.queue(expense);
    return "queued";
  }
}

import { describe, expect, it } from "vitest";

import { ApiRequestError, type ExpenseInput } from "@/shared/api/auto";

import {
  createClientMutationId,
  createExpenseMutation,
  loadQueuedExpenses,
  saveQueuedExpenses,
  shouldRetryExpense,
  submitNewExpense,
  type ExpenseQueueStorage,
  type QueuedExpense
} from "./expense-queue";

class MemoryStorage implements ExpenseQueueStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const categoryId = "770e8400-e29b-41d4-a716-446655440001";
const mutationId = "770e8400-e29b-41d4-a716-446655440002";
const userA = "770e8400-e29b-41d4-a716-446655440003";
const userB = "770e8400-e29b-41d4-a716-446655440004";

function expenseInput(): ExpenseInput {
  return {
    amountKopecks: 12_300,
    categoryId,
    merchant: "АЗС",
    occurredOn: "2026-07-20"
  };
}

describe("offline expense queue", () => {
  it("creates a UUID when randomUUID is unavailable on an insecure LAN origin", () => {
    const clientMutationId = createClientMutationId({
      getRandomValues(values) {
        values.set(Array.from({ length: 16 }, (_, index) => index));
        return values;
      }
    });

    expect(clientMutationId).toBe("00010203-0405-4607-8809-0a0b0c0d0e0f");
  });

  it("gives a new expense one stable client mutation ID", () => {
    const mutation = createExpenseMutation(expenseInput(), () => mutationId);
    const storage = new MemoryStorage();

    saveQueuedExpenses(storage, userA, [mutation]);

    expect(mutation.clientMutationId).toBe(mutationId);
    expect(loadQueuedExpenses(storage, userA)).toEqual([mutation]);
  });

  it("isolates queue records by profile", () => {
    const storage = new MemoryStorage();
    const mutation = createExpenseMutation(expenseInput(), () => mutationId);

    saveQueuedExpenses(storage, userA, [mutation]);

    expect(loadQueuedExpenses(storage, userA)).toEqual([mutation]);
    expect(loadQueuedExpenses(storage, userB)).toEqual([]);
    expect(storage.values.size).toBe(1);
  });

  it("drops malformed persisted queue records", () => {
    const storage = new MemoryStorage();
    const valid = createExpenseMutation(expenseInput(), () => mutationId);
    saveQueuedExpenses(storage, userA, [valid]);
    const [key] = storage.values.keys();
    storage.setItem(key!, JSON.stringify([valid, { amountKopecks: -1 }, null]));

    expect(loadQueuedExpenses(storage, userA)).toEqual([valid]);
  });

  it.each([
    ["network failure", new TypeError("Failed to fetch"), true],
    ["rate limit", new ApiRequestError("slow down", 429), true],
    ["server failure", new ApiRequestError("unavailable", 503), true],
    ["invalid input", new ApiRequestError("bad request", 400), false],
    ["unauthorized", new ApiRequestError("locked", 401), false],
    ["conflict", new ApiRequestError("conflict", 409), false]
  ])("classifies %s for queue retention", (_label, error, expected) => {
    expect(shouldRetryExpense(error)).toBe(expected);
  });

  it("queues a network failure even while the browser reports online", async () => {
    const queued: QueuedExpense[] = [];

    const result = await submitNewExpense(expenseInput(), {
      createId: () => mutationId,
      isOnline: true,
      queue: (expense) => queued.push(expense),
      send: async () => {
        throw new TypeError("Failed to fetch");
      }
    });

    expect(result).toBe("queued");
    expect(queued).toHaveLength(1);
    expect(queued[0]?.clientMutationId).toBe(mutationId);
  });

  it("surfaces a permanent 4xx response without keeping the record", async () => {
    const queued: QueuedExpense[] = [];

    await expect(
      submitNewExpense(expenseInput(), {
        createId: () => mutationId,
        isOnline: true,
        queue: (expense) => queued.push(expense),
        send: async () => {
          throw new ApiRequestError("invalid", 422);
        }
      })
    ).rejects.toMatchObject({ status: 422 });
    expect(queued).toEqual([]);
  });

  it("does not accept an arbitrary queued expense shape", () => {
    const malformed = { ...expenseInput(), clientMutationId: "not-a-uuid" } as QueuedExpense;
    const storage = new MemoryStorage();
    storage.values.set(`auto-spendings:queued-expenses:${userA}`, JSON.stringify([malformed]));

    expect(loadQueuedExpenses(storage, userA)).toEqual([]);
  });
});

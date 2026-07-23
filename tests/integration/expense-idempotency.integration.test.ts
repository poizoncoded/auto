import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Category, Expense } from "@/server/database/entities";
import type { CreateExpenseInput } from "@/server/http/schemas";
import { registerUser } from "@/server/services/auth";
import { createExpense } from "@/server/services/finance";

import { createDisposableDatabase, type DisposableDatabase } from "./disposable-database";

describe("expense idempotency", () => {
  let disposable: DisposableDatabase;

  beforeAll(async () => {
    disposable = await createDisposableDatabase("expense_idempotency");
  }, 30_000);

  afterAll(async () => {
    await disposable?.dispose();
  });

  it("returns one expense for repeated client mutation IDs", async () => {
    const user = await registerUser(disposable.database, {
      displayName: "Идемпотентность",
      pin: "123456"
    });
    const category = await disposable.database.getRepository(Category).findOneByOrFail({
      userId: user.id
    });
    const input: CreateExpenseInput & { clientMutationId: string } = {
      amountKopecks: 12_300,
      categoryId: category.id,
      clientMutationId: "770e8400-e29b-41d4-a716-446655440010",
      occurredOn: "2026-07-20"
    };

    const first = await createExpense(disposable.database, user.id, input);
    const repeated = await createExpense(disposable.database, user.id, input);

    expect(repeated.id).toBe(first.id);
    await expect(
      disposable.database.getRepository(Expense).countBy({ userId: user.id })
    ).resolves.toBe(1);
  });

  it("returns the winning expense when the same mutation races", async () => {
    const user = await registerUser(disposable.database, {
      displayName: "Гонка запросов",
      pin: "654321"
    });
    const category = await disposable.database.getRepository(Category).findOneByOrFail({
      userId: user.id
    });
    const input: CreateExpenseInput = {
      amountKopecks: 45_600,
      categoryId: category.id,
      clientMutationId: "770e8400-e29b-41d4-a716-446655440011",
      occurredOn: "2026-07-20"
    };

    const [left, right] = await Promise.all([
      createExpense(disposable.database, user.id, input),
      createExpense(disposable.database, user.id, input)
    ]);

    expect(right.id).toBe(left.id);
    await expect(
      disposable.database.getRepository(Expense).countBy({ userId: user.id })
    ).resolves.toBe(1);
  });
});

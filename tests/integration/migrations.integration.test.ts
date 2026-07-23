import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Category, User } from "@/server/database/entities";
import { registerUser } from "@/server/services/auth";

import { createDisposableDatabase, type DisposableDatabase } from "./disposable-database";

describe("additive migration lifecycle", () => {
  let disposable: DisposableDatabase;

  beforeAll(async () => {
    disposable = await createDisposableDatabase("migrations");
  }, 30_000);

  afterAll(async () => {
    await disposable?.dispose();
  });

  it("reverts and reapplies additive migrations without changing profile data", async () => {
    await registerUser(disposable.database, {
      displayName: "Проверка миграций",
      pin: "123456"
    });
    const before = {
      categories: await disposable.database.getRepository(Category).count(),
      users: await disposable.database.getRepository(User).count()
    };

    await disposable.database.undoLastMigration();
    await disposable.database.undoLastMigration();

    await expect(disposable.database.query("SELECT count(*)::int AS count FROM users")).resolves.toEqual([
      { count: before.users }
    ]);
    await expect(
      disposable.database.query("SELECT count(*)::int AS count FROM categories")
    ).resolves.toEqual([{ count: before.categories }]);

    await disposable.database.runMigrations();

    const migrationRows = (await disposable.database.query(
      "SELECT name FROM migrations ORDER BY id"
    )) as Array<{ name: string }>;
    expect(migrationRows.map((row) => row.name)).toEqual([
      "InitialSchema1784484000000",
      "ExpenseIdempotency1784512800000",
      "AuthAttempts1784516400000"
    ]);
    await expect(disposable.database.getRepository(User).count()).resolves.toBe(before.users);
    await expect(disposable.database.getRepository(Category).count()).resolves.toBe(
      before.categories
    );
  });
});

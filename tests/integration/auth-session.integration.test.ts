import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Session } from "@/server/database/entities";
import { authenticateUser, changePin, registerUser } from "@/server/services/auth";
import { createSession, getSessionUserId } from "@/server/security/session-store";

import { createDisposableDatabase, type DisposableDatabase } from "./disposable-database";

describe("PIN session rotation", () => {
  let disposable: DisposableDatabase;

  beforeAll(async () => {
    disposable = await createDisposableDatabase("pin_rotation");
  }, 30_000);

  afterAll(async () => {
    await disposable?.dispose();
  });

  it("revokes every old session and creates one replacement transactionally", async () => {
    const user = await registerUser(disposable.database, {
      displayName: "Смена PIN",
      pin: "123456"
    });
    const oldSessionA = await createSession(disposable.database, user.id);
    const oldSessionB = await createSession(disposable.database, user.id);

    const replacement = await changePin(disposable.database, user.id, {
      currentPin: "123456",
      nextPin: "654321"
    });

    await expect(getSessionUserId(disposable.database, oldSessionA.token)).resolves.toBeNull();
    await expect(getSessionUserId(disposable.database, oldSessionB.token)).resolves.toBeNull();
    await expect(
      disposable.database.getRepository(Session).countBy({ userId: user.id })
    ).resolves.toBe(1);
    expect(replacement).toBeDefined();
    await expect(
      getSessionUserId(
        disposable.database,
        (replacement as unknown as { token: string }).token
      )
    ).resolves.toBe(user.id);
    await expect(
      authenticateUser(disposable.database, { pin: "123456", userId: user.id })
    ).rejects.toMatchObject({ code: "INVALID_PIN" });
    await expect(
      authenticateUser(disposable.database, { pin: "654321", userId: user.id })
    ).resolves.toEqual(user);
  });
});

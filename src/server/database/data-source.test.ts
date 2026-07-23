import { DataSource } from "typeorm";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe("database configuration", () => {
  it("reads DATABASE_URL from the runtime process environment", async () => {
    process.env.DATABASE_URL = "postgres://runtime-only.invalid/runtime";
    const { createDataSource } = await import("./data-source");

    const database = createDataSource();

    expect((database.options as { url?: string }).url === process.env.DATABASE_URL).toBe(true);
  });

  it("retries initialization after a rejected attempt", async () => {
    process.env.DATABASE_URL = "postgres://runtime-only.invalid/runtime";
    const initializationError = new Error("database unavailable");
    const recoveredDatabase = { recovered: true } as unknown as DataSource;
    const initialize = vi
      .spyOn(DataSource.prototype, "initialize")
      .mockRejectedValueOnce(initializationError)
      .mockResolvedValueOnce(recoveredDatabase);
    const { getDataSource } = await import("./data-source");

    await expect(getDataSource()).rejects.toBe(initializationError);
    await expect(getDataSource()).resolves.toBe(recoveredDatabase);
    expect(initialize).toHaveBeenCalledTimes(2);
  });
});

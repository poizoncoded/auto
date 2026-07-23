import { randomBytes } from "node:crypto";

import { DataSource } from "typeorm";

import { createDataSource } from "@/server/database/data-source";

export interface DisposableDatabase {
  database: DataSource;
  dispose: () => Promise<void>;
  name: string;
  url: string;
}

async function runAdminQuery(connectionUrl: string, query: string): Promise<void> {
  const admin = new DataSource({ type: "postgres", url: connectionUrl });
  await admin.initialize();

  try {
    await admin.query(query);
  } finally {
    await admin.destroy();
  }
}

export async function createDisposableDatabase(label: string): Promise<DisposableDatabase> {
  const baseUrl = process.env.DATABASE_URL;

  if (!baseUrl) {
    throw new Error("DATABASE_URL is required for disposable PostgreSQL tests");
  }

  const suffix = randomBytes(4).toString("hex");
  const safeLabel = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").slice(0, 24);
  const name = `auto_spendings_test_${safeLabel}_${process.pid}_${Date.now()}_${suffix}`;

  if (!/^auto_spendings_test_[a-z0-9_]+$/.test(name)) {
    throw new Error("Refusing to create an unsafe disposable database name");
  }

  const adminUrl = new URL(baseUrl);
  adminUrl.pathname = "/postgres";
  const testUrl = new URL(baseUrl);
  testUrl.pathname = `/${name}`;

  await runAdminQuery(adminUrl.toString(), `CREATE DATABASE "${name}"`);
  const database = createDataSource(testUrl.toString());

  try {
    await database.initialize();
    await database.runMigrations();
  } catch (error) {
    if (database.isInitialized) {
      await database.destroy();
    }
    await runAdminQuery(adminUrl.toString(), `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    throw error;
  }

  return {
    database,
    name,
    url: testUrl.toString(),
    dispose: async () => {
      if (database.isInitialized) {
        await database.destroy();
      }
      await runAdminQuery(adminUrl.toString(), `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    }
  };
}

import { DataSource } from "typeorm";

import { AppError } from "../http/error.ts";

import { databaseEntities } from "./entities.ts";
import { InitialSchema1784484000000 } from "./migrations/202607190001-initial-schema.ts";
import { ExpenseIdempotency1784512800000 } from "./migrations/202607200001-expense-idempotency.ts";
import { AuthAttempts1784516400000 } from "./migrations/202607200002-auth-attempts.ts";

export function createDataSource(databaseUrl = process.env.DATABASE_URL): DataSource {
  if (!databaseUrl) {
    throw new AppError("DATABASE_URL is required", "CONFIGURATION_ERROR", 500);
  }

  return new DataSource({
    entities: [...databaseEntities],
    logging: false,
    migrations: [
      InitialSchema1784484000000,
      ExpenseIdempotency1784512800000,
      AuthAttempts1784516400000
    ],
    synchronize: false,
    type: "postgres",
    url: databaseUrl
  });
}

let connection: Promise<DataSource> | undefined;

export function getDataSource(): Promise<DataSource> {
  if (!connection) {
    const attempt = createDataSource().initialize();
    connection = attempt;
    void attempt.catch(() => {
      if (connection === attempt) {
        connection = undefined;
      }
    });
  }

  return connection;
}

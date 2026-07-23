import { createDataSource } from "../src/server/database/data-source.ts";

const dataSource = createDataSource();

await dataSource.initialize();

try {
  await dataSource.runMigrations();
} finally {
  await dataSource.destroy();
}

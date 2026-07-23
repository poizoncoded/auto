import type { MigrationInterface, QueryRunner } from "typeorm";

export class ExpenseIdempotency1784512800000 implements MigrationInterface {
  name = "ExpenseIdempotency1784512800000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE expenses
        ADD COLUMN client_mutation_id uuid;
      CREATE UNIQUE INDEX expenses_user_client_mutation_id_uidx
        ON expenses(user_id, client_mutation_id)
        WHERE client_mutation_id IS NOT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS expenses_user_client_mutation_id_uidx;
      ALTER TABLE expenses DROP COLUMN IF EXISTS client_mutation_id;
    `);
  }
}

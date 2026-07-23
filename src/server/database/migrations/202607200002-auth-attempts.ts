import type { MigrationInterface, QueryRunner } from "typeorm";

export class AuthAttempts1784516400000 implements MigrationInterface {
  name = "AuthAttempts1784516400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE auth_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        operation varchar(16) NOT NULL
          CHECK (operation IN ('login', 'pin-change', 'register')),
        scope_hash char(64) NOT NULL,
        attempt_count integer NOT NULL CHECK (attempt_count > 0),
        window_started_at timestamptz NOT NULL,
        blocked_until timestamptz,
        expires_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT auth_attempts_operation_scope_hash_key
          UNIQUE (operation, scope_hash)
      );
      CREATE INDEX auth_attempts_expires_at_idx ON auth_attempts(expires_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS auth_attempts");
  }
}

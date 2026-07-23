import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784484000000 implements MigrationInterface {
  name = "InitialSchema1784484000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        display_name varchar(80) NOT NULL UNIQUE,
        status varchar(24) NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE pin_credentials (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        credential text NOT NULL,
        changed_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash char(64) NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX sessions_user_id_idx ON sessions(user_id);
      CREATE TABLE vehicles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(80) NOT NULL,
        type varchar(32) NOT NULL,
        energy_unit varchar(16) NOT NULL,
        odometer_unit varchar(8) NOT NULL DEFAULT 'km',
        currency char(3) NOT NULL DEFAULT 'RUB',
        archived boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX vehicles_user_id_idx ON vehicles(user_id);
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(60) NOT NULL,
        icon varchar(32) NOT NULL,
        color char(7) NOT NULL,
        kind varchar(16) NOT NULL DEFAULT 'expense',
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX categories_user_id_idx ON categories(user_id);
      CREATE TABLE receipt_providers (
        key varchar(64) PRIMARY KEY,
        display_name varchar(80) NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        supported_fields jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      INSERT INTO receipt_providers(key, display_name, enabled, supported_fields)
      VALUES ('taxcom-manual', 'Такском Чек', true, '["fp", "s", "t"]'::jsonb);
      CREATE TABLE receipts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        decoded_payload text NOT NULL,
        provider_key varchar(64) REFERENCES receipt_providers(key) ON DELETE SET NULL,
        fiscal_drive_number varchar(32),
        fiscal_document_number varchar(32),
        fiscal_sign varchar(32),
        operation_type varchar(16),
        issued_at timestamp,
        total_kopecks integer,
        status varchar(16) NOT NULL DEFAULT 'pending',
        raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        reviewed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX receipts_user_id_idx ON receipts(user_id);
      CREATE TABLE expenses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
        category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        receipt_id uuid UNIQUE REFERENCES receipts(id) ON DELETE SET NULL,
        amount_kopecks integer NOT NULL CHECK (amount_kopecks > 0),
        occurred_on date NOT NULL,
        merchant varchar(140),
        note text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX expenses_user_id_idx ON expenses(user_id);
      CREATE INDEX expenses_vehicle_id_idx ON expenses(vehicle_id);
      CREATE INDEX expenses_category_id_idx ON expenses(category_id);
      CREATE TABLE fuel_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id uuid NOT NULL UNIQUE REFERENCES expenses(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind varchar(16) NOT NULL CHECK (kind IN ('fuel', 'charging')),
        odometer_km integer NOT NULL CHECK (odometer_km >= 0),
        quantity_milli_units integer NOT NULL CHECK (quantity_milli_units > 0),
        unit_price_kopecks integer CHECK (unit_price_kopecks >= 0)
      );
      CREATE INDEX fuel_entries_user_id_idx ON fuel_entries(user_id);
      CREATE TABLE receipt_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        receipt_id uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        quantity_milli_units integer NOT NULL DEFAULT 1000 CHECK (quantity_milli_units > 0),
        total_kopecks integer NOT NULL CHECK (total_kopecks >= 0)
      );
      CREATE INDEX receipt_items_receipt_id_idx ON receipt_items(receipt_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS receipt_items;
      DROP TABLE IF EXISTS fuel_entries;
      DROP TABLE IF EXISTS expenses;
      DROP TABLE IF EXISTS receipts;
      DROP TABLE IF EXISTS receipt_providers;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS vehicles;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS pin_credentials;
      DROP TABLE IF EXISTS users;
    `);
  }
}

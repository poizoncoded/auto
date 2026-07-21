# Task 2: Runtime And Schema

**Source:** `plans/auto-spendings.md` sections "Architecture", "Initial
database tables", and "Acceptance Checks".

**Goal:** Create the root Astro/React runtime, TypeScript toolchain,
PostgreSQL connection, TypeORM `EntitySchema` metadata, and first migrations.

**Files:**

- Create: `package.json`
- Create: `package-lock.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.env.example`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.integration.config.ts`
- Create: `src/env.ts`
- Create: `src/server/database/data-source.ts`
- Create: `src/server/database/entities.ts`
- Create: `src/server/database/migrations/`
- Create: `scripts/migrate.ts`
- Create: `scripts/revert-migration.ts`
- Test: `tests/integration/migrations.integration.test.ts`

**Interfaces:**

- Consumes: Task 1 verified prerequisites, local database readiness, root
  checkout, and source-of-truth rule.
- Produces: `AppDataSource`, `databaseEntities`, migration commands, and
  database tables consumed by Tasks 3-6.

## Steps

- [ ] **Step 1: Confirm the root app workspace**

```bash
pwd
```

Expected: `pwd` is `/Users/poizoncc/Work/poizoncoded/auto`, and Task 1 has
recorded passing prerequisite and local database readiness evidence.

- [ ] **Step 2: Confirm Node.js version**

```bash
node --version
```

Expected: major version is `24` or newer.

- [ ] **Step 3: Create the npm-based Astro runtime**

```bash
npm init -y
npm install astro@7.1.3 @astrojs/react@6.0.1 @astrojs/node@11.0.2 react@19.2.7 react-dom@19.2.7 typeorm@1.1.0 pg@8.22.0 zod@4.4.3 @zxing/browser@0.2.1 lucide-react@1.25.0 clsx@2.1.1
npm install --save-dev typescript@7.0.2 @astrojs/check@0.9.9 @types/node@26.1.1 @types/react@19.2.17 @types/react-dom@19.2.3 vitest@4.1.10 eslint@10.7.0 @eslint/js@10.0.1 typescript-eslint@8.65.0 mprocs@0.9.6
```

Expected: `package.json` and `package-lock.json` exist and the project uses
`npm` as the package manager.

- [ ] **Step 4: Add core scripts**

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "astro dev --host 127.0.0.1",
    "build": "astro build",
    "start": "node ./dist/server/entry.mjs",
    "test": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "lint": "eslint .",
    "typecheck": "astro check && tsc --noEmit",
    "db:migrate": "node scripts/migrate.ts",
    "db:revert": "node scripts/revert-migration.ts"
  }
}
```

Expected: `npm run` lists every script above.

- [ ] **Step 5: Add Astro, TypeScript, and environment configuration**

Create the runtime config files with the Node adapter, React integration, strict
TypeScript settings, Vitest configs, ESLint flat config, and a committed
`.env.example` containing only the safe local `DATABASE_URL` from
`INSTALL.md`.

Expected: `astro.config.mjs`, `tsconfig.json`, `eslint.config.mjs`,
`vitest.config.ts`, `vitest.integration.config.ts`, and `.env.example` exist.

- [ ] **Step 6: Create decorator-free TypeORM metadata**

Create `src/server/database/entities.ts` with TypeORM `EntitySchema` targets for
`users`, `pin_credentials`, `sessions`, `auth_attempts`, `vehicles`,
`categories`, `expenses`, `fuel_entries`, `receipts`, `receipt_items`, and
`receipt_providers`. Create `src/server/database/data-source.ts` with
`synchronize: false` and explicit migrations.

Expected: database metadata is available through a `databaseEntities` export and
the data source is available through an `AppDataSource` export.

- [ ] **Step 7: Add migration runner commands**

Create `scripts/migrate.ts` and `scripts/revert-migration.ts` so migrations run
against `DATABASE_URL` and always close the TypeORM data source.

Expected: `npm run db:migrate` and `npm run db:revert` resolve their scripts.

- [ ] **Step 8: Add migration integration coverage**

Create `tests/integration/migrations.integration.test.ts` to run migrations up
and down against a disposable PostgreSQL database named from
`poizoncoded_auto`.

Expected: the test creates and removes only disposable databases.

- [ ] **Step 9: Verify TypeORM metadata does not use decorators**

```bash
rg -n 'import "reflect-metadata"|experimentalDecorators|emitDecoratorMetadata|@(Entity|Column|Index|Primary|CreateDate|UpdateDate)|"reflect-metadata": "' package.json tsconfig.json src/server/database
```

Expected: no output and exit status `1`. `npm ls reflect-metadata` may still
show a transitive dependency under `typeorm`.

- [ ] **Step 10: Run runtime checks**

```bash
npm run typecheck
npm run test:integration -- tests/integration/migrations.integration.test.ts
```

Expected: typecheck passes and migration integration coverage passes.

- [ ] **Step 11: Completion gate**

The task is complete when the root runtime exists, schema metadata is
decorator-free, migrations run through scripts, and migration integration tests
pass.

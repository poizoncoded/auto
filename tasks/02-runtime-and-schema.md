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
- Create: `docker-compose.yml`
- Create: `mprocs.yaml`
- Create: `mprocs.https.yaml`
- Create: `scripts/dev-tunnel.ts`
- Create: `scripts/rebuild-astro.ts`
- Create: `src/shared/lib/development-https.ts`
- Create: `src/server/development/https-tunnel.ts`
- Create: `src/server/development/https-camera-handoff.ts`
- Create: `src/pages/api/development/https-url.ts`
- Create: `src/pages/api/development/https-camera.ts`
- Create: `src/env.ts`
- Create: `src/server/database/data-source.ts`
- Create: `src/server/database/entities.ts`
- Create: `src/server/database/migrations/`
- Create: `scripts/migrate.ts`
- Create: `scripts/revert-migration.ts`
- Test: `tests/integration/migrations.integration.test.ts`
- Test: `src/server/development/https-tunnel.test.ts`
- Test: `src/server/development/https-camera-handoff.test.ts`
- Test: `src/server/development/dev-workflow.test.ts`
- Test: `src/pages/api/development/https-camera.test.ts`

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
npm install astro@7.1.3 @astrojs/react@6.0.1 @astrojs/node@11.0.2 react@19.2.7 react-dom@19.2.7 typeorm@1.1.0 pg@8.22.0 zod@4.4.3 jsqr@1.4.0 lucide-react@1.25.0
npm install --save-dev typescript@5.9.3 @astrojs/check@0.9.9 @types/node@26.1.1 @types/react@19.2.17 @types/react-dom@19.2.3 vitest@4.1.10 eslint@10.7.0 @eslint/js@10.0.1 typescript-eslint@8.65.0 eslint-plugin-react-hooks@7.1.1 vite@8.1.5 mprocs@0.9.6 yaml@2.9.0 qrcode@1.5.4 @types/qrcode@1.5.6
```

Expected: `package.json` and `package-lock.json` exist and the project uses
`npm` as the package manager.

- [ ] **Step 4: Add core scripts**

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "mprocs --config mprocs.yaml",
    "dev:https": "mprocs --config mprocs.https.yaml",
    "dev:tunnel": "node scripts/dev-tunnel.ts",
    "dev:rebuild": "node scripts/rebuild-astro.ts && node ./node_modules/astro/bin/astro.mjs sync",
    "predev:fe": "npm run dev:rebuild",
    "dev:fe": "node --env-file-if-exists=.env ./node_modules/astro/bin/astro.mjs dev --host 0.0.0.0 --port 4321 --force",
    "dev:lan": "npm run dev:fe",
    "predev:lan:alt": "npm run dev:rebuild",
    "dev:lan:alt": "node --env-file-if-exists=.env ./node_modules/astro/bin/astro.mjs dev --host 0.0.0.0 --port 4322 --force",
    "dev:be": "npm run db:up && npm run db:migrate && docker compose logs --follow --tail 50 db",
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
`INSTALL.md`. Keep ordinary `mprocs.yaml` limited to frontend and backend. Add
an opt-in `mprocs.https.yaml` that also starts `scripts/dev-tunnel.ts`. The
runner must recreate the Docker Compose `https` profile using pinned
`cloudflare/cloudflared:2026.7.0`, forward to the frontend with
the public tunnel host intact, validate the generated `*.trycloudflare.com`
origin, publish it to temporary development state, and remove that state on
exit. Allow only `.trycloudflare.com` as the additional Vite development host.
Reconstruct API origin checks and Secure cookies from `x-forwarded-proto`. Add a
development-only, no-store `/api/development/https-url` endpoint that reads the
validated origin and returns 404 in production.

Add `/api/development/https-camera` with an authenticated POST that issues a
one-minute, single-use opaque handoff and an HTTPS GET that consumes it, creates
a new origin-scoped session, and redirects to `/receipts?camera=1`. Never put a
long-lived session token in a URL. Bodyless browser mutations must still send an
explicit empty JSON object so Astro's cross-site form protection remains valid
behind TLS termination.

Expected: `astro.config.mjs`, `tsconfig.json`, `eslint.config.mjs`,
`vitest.config.ts`, `vitest.integration.config.ts`, `.env.example`, both
`mprocs` configs, and the Docker Compose services exist. `npm run dev:https`
prints a temporary trusted `https://*.trycloudflare.com` URL and publishes it
to the HTTP UI for one-tap mobile camera handoff without exposing PostgreSQL.

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
decorator-free, migrations run through scripts, migration integration tests
pass, and trusted HTTPS development is reproducible through Docker.

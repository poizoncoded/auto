# Auto Spendings Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Auto Spendings MVP with the smallest reliable Docker flow,
including repeatable migrations and fast application updates.

**Architecture:** Start with one application Docker image that can run both the
Astro server and the migration command. Run PostgreSQL as a managed database or
as the official `postgres:18-alpine` Compose service; avoid packing PostgreSQL
and Node.js into the same production container. Split into N images only when
the single app image becomes too large, too slow, or needs independent release
cadence.

**Tech Stack:** Node.js 24+, Astro 7.1.3 Node adapter, TypeORM 1.1.0
migrations, PostgreSQL 18 through Docker or a managed service, Docker Engine
29+, Docker Compose v5+, npm, and native Node.js type stripping for TypeScript
migration scripts.

## Global Constraints

- Source application: root checkout (`.`).
- Source implementation contract: the app must be generated from committed
  `plans/` and `tasks/` only before it is packaged.
- Prerequisite gate: until it passes, the only allowed work is installing or
  upgrading prerequisites, starting or creating the local PostgreSQL database,
  rerunning the readiness checks, and updating planning docs. Do not build
  images, run migrations, start Compose, or deploy until Task 1 proves Node.js
  24+, Docker Engine 29+, Docker Compose v5+, Ruflo package access, a reachable
  PostgreSQL 18 server, and the `poizoncoded_auto` database.
- Deployment file changes follow the same AI-driven delivery rule as the app:
  humans approve intent and secrets; AI agents generate committed files and
  verification evidence.
- First deployment target: one VPS or localhost-like Docker host.
- Public app port inside the container: `4321`.
- Database: PostgreSQL database `poizoncoded_auto`.
- App start command: `npm run start`.
- Migration command: `npm run db:migrate`.
- Rollback command for known-safe migration rollback: `npm run db:revert`.
- Keep `DATABASE_URL` and PostgreSQL credentials in environment variables or
  deployment secrets, not in Git.
- Run exactly one migration job per release before restarting the web process.
- Use forward-compatible migrations for fast updates: expand, deploy code,
  then contract in a later release.
- Do not use `synchronize: true`.
- Do not expose PostgreSQL on a public interface.
- Back up the database before any migration that changes existing data.

---

## Recommended Choice

Use **one application image for all application roles**:

- `auto-spendings-app` runs the Astro server.
- The same image runs a one-shot migration job.
- PostgreSQL runs separately as managed Postgres or `postgres:18-alpine`.

This is the simplest production-worthy setup because the web server and
migrator use the exact same application code and dependency tree.

Do **not** use a single production container that runs both PostgreSQL and the
Node.js app. That layout is acceptable only for throwaway demos because backup,
restart, health checks, and upgrades become coupled.

## Deployment Layouts

| Layout | Containers | Best For | Trade-off |
| --- | --- | --- | --- |
| One app image plus DB | `app`, one-shot `migrate`, `db` or managed Postgres | First deploy, VPS, simplest updates | Image includes build and migration tooling |
| One physical container for app and DB | `all-in-one` | Portable demo only | Poor backup and restart boundaries |
| N images | `web`, `migrator`, optional `worker`, `db` or managed Postgres | Larger deployment, stricter image size/security | More Dockerfiles and release coordination |

## Task 1: Add The Single App Image

**Files:**

- Create: `Dockerfile`
- Create: `.dockerignore`
- Modify: none

**Purpose:** Build one Docker image that can run `npm run start` and
`npm run db:migrate`.

- [ ] **Step 1: Create `.dockerignore`**

```dockerignore
.astro/
.env
.env.*
!.env.example
.git/
.superpowers/
coverage/
dist/
node_modules/
npm-debug.log*
pnpm-lock.yaml
pnpm-workspace.yaml
```

- [ ] **Step 2: Create the first `Dockerfile`**

```dockerfile
FROM node:24-alpine AS app

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 4321

CMD ["npm", "run", "start"]
```

This intentionally keeps dev dependencies in the image because the migration
command runs TypeScript scripts directly through Node.js type stripping.
Optimize later with a dedicated migrator image or compiled migration runner.

- [ ] **Step 3: Build the image locally**

```bash
docker build -t auto-spendings-app:local .
```

Expected: image builds successfully and `npm run build` completes inside the
Docker build.

- [ ] **Step 4: Completion gate**

```bash
docker run --rm auto-spendings-app:local node --version
docker run --rm auto-spendings-app:local npm run --silent
```

Expected: Node is version `24` or newer, and npm lists the app scripts.

## Task 2: Add A Production Compose File

**Files:**

- Create: `docker-compose.prod.yml`
- Create: `.env.deploy.example`
- Modify: `.gitignore`

**Purpose:** Run PostgreSQL, run migrations once, then start the web app.

- [ ] **Step 1: Allow the deploy env template to be committed**

Keep real deploy secrets ignored, but allow the example file:

```gitignore
# Environment and local secrets
.env
.env.*
!.env.example
!.env.deploy.example
```

- [ ] **Step 2: Create `.env.deploy.example`**

```dotenv
POSTGRES_DB=poizoncoded_auto
POSTGRES_USER=auto_spendings
POSTGRES_PASSWORD=change_me_before_first_deploy
DATABASE_URL=postgres://auto_spendings:change_me_before_first_deploy@db:5432/poizoncoded_auto
APP_IMAGE=auto-spendings-app:local
APP_PORT=4321
```

- [ ] **Step 3: Create `docker-compose.prod.yml`**

```yaml
services:
  db:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: "${POSTGRES_DB:?Set POSTGRES_DB}"
      POSTGRES_PASSWORD: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}"
      POSTGRES_USER: "${POSTGRES_USER:?Set POSTGRES_USER}"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 20
    volumes:
      - auto_spendings_postgres_data:/var/lib/postgresql

  migrate:
    image: "${APP_IMAGE:?Set APP_IMAGE}"
    restart: "no"
    env_file:
      - .env.deploy
    command: ["npm", "run", "db:migrate"]
    depends_on:
      db:
        condition: service_healthy

  app:
    image: "${APP_IMAGE:?Set APP_IMAGE}"
    restart: unless-stopped
    env_file:
      - .env.deploy
    environment:
      HOST: "0.0.0.0"
      PORT: "4321"
    ports:
      - "127.0.0.1:${APP_PORT:-4321}:4321"
    depends_on:
      migrate:
        condition: service_completed_successfully

volumes:
  auto_spendings_postgres_data:
```

For managed PostgreSQL, remove the `db` service, remove `depends_on` from
`migrate`, and set `DATABASE_URL` to the managed database secret.

- [ ] **Step 4: Create the real deploy env locally**

```bash
cp .env.deploy.example .env.deploy
```

Expected: `.env.deploy` exists locally and is not committed.

- [ ] **Step 5: Completion gate**

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml config
```

Expected: Compose prints a valid resolved configuration.

## Task 3: First Deploy

**Files:**

- Read: `docker-compose.prod.yml`
- Read: `.env.deploy`
- Modify: none

**Purpose:** Start the production-like stack for the first time.

- [ ] **Step 1: Build the app image**

```bash
docker build -t auto-spendings-app:$(git rev-parse --short HEAD) .
```

- [ ] **Step 2: Point `.env.deploy` at the image tag**

```bash
IMAGE_TAG="$(git rev-parse --short HEAD)"
export IMAGE_TAG
perl -0pi -e 's/^APP_IMAGE=.*/APP_IMAGE=auto-spendings-app:$ENV{IMAGE_TAG}/m' .env.deploy
rg -n "^APP_IMAGE=auto-spendings-app:${IMAGE_TAG}$" .env.deploy
```

Expected: `.env.deploy` points at the image tag built in Step 1. Keep the rest
of `.env.deploy` secret and local.

- [ ] **Step 3: Start database and run migrations**

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml up --detach db
docker compose --env-file .env.deploy -f docker-compose.prod.yml run --rm migrate
```

Expected: PostgreSQL becomes healthy and migrations finish once.

- [ ] **Step 4: Start the app**

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml up --detach app
```

Expected: app starts and binds to `127.0.0.1:4321`.

- [ ] **Step 5: Smoke test**

```bash
curl -I http://127.0.0.1:4321/dashboard
curl -I http://127.0.0.1:4321/manifest.webmanifest
```

Expected: both requests return HTTP success responses.

## Task 4: Fast Update Flow

**Files:**

- Read: `docker-compose.prod.yml`
- Read: `scripts/migrate.ts`
- Modify: none for normal updates

**Purpose:** Ship a new app version with seconds of app restart time and one
safe migration window.

- [ ] **Step 1: Build the new image and update `.env.deploy`**

```bash
IMAGE_TAG="$(git rev-parse --short HEAD)"
export IMAGE_TAG
docker build -t "auto-spendings-app:${IMAGE_TAG}" .
perl -0pi -e 's/^APP_IMAGE=.*/APP_IMAGE=auto-spendings-app:$ENV{IMAGE_TAG}/m' .env.deploy
```

- [ ] **Step 2: Back up before data-changing migrations**

For Compose Postgres:

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "backup-$(date +%Y%m%d-%H%M%S).sql"
```

For managed Postgres, use the provider snapshot or backup command before
running migrations.

- [ ] **Step 3: Run the migration job exactly once**

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml run --rm migrate
```

Expected: migration job exits with status `0`.

- [ ] **Step 4: Restart only the app service**

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml up --detach --no-deps --force-recreate app
```

Expected: app restarts using the new image without restarting PostgreSQL.

- [ ] **Step 5: Smoke test after restart**

```bash
curl -I http://127.0.0.1:4321/dashboard
curl -I http://127.0.0.1:4321/manifest.webmanifest
docker compose --env-file .env.deploy -f docker-compose.prod.yml logs --tail 100 app
```

Expected: dashboard and manifest respond successfully; app logs contain no
startup or database errors.

## Task 5: Migration Rules For Fast Updates

**Files:**

- Read: `src/server/database/migrations/`
- Read: `src/server/database/data-source.ts`
- Modify: migration files only when schema changes

**Purpose:** Keep app updates fast by avoiding migrations that require long
downtime.

- [ ] **Step 1: Use expand-deploy-contract**

For schema changes, split releases like this:

1. Expand: add nullable columns, new tables, or compatible indexes.
2. Deploy: release app code that writes both old and new shapes if needed.
3. Backfill: run a bounded backfill command or migration after deploy.
4. Contract: remove old columns or code in a later release after a backup.

- [ ] **Step 2: Avoid blocking migrations in hot releases**

Do not include these in the same release as a fast app update:

- Dropping columns used by the old app version.
- Renaming columns without compatibility code.
- Rewriting large tables inside one transaction.
- Adding `NOT NULL` constraints before a backfill proves every row has data.
- Running provider API calls from a database migration.

- [ ] **Step 3: Use `db:revert` only for known-safe rollback**

```bash
npm run db:revert
```

Use this in development, staging, or a production incident only when the down
migration is known not to destroy valid user data. Prefer restoring from backup
for destructive migration failures.

- [ ] **Step 4: Completion gate**

Every new migration has a test in `tests/integration/migrations.integration.test.ts`
or a new focused integration file, and `npm run test:integration` passes.

## Task 6: N Docker Images Path

**Files:**

- Create when splitting: `docker/web.Dockerfile`
- Create when splitting: `docker/migrator.Dockerfile`
- Modify when splitting: `docker-compose.prod.yml`

**Purpose:** Split images only after the one-image deployment proves too broad.

- [ ] **Step 1: Split when one of these is true**

Use N images when at least one condition is true:

- Web image must exclude tests, compiler-only packages, or build-only
  dependencies.
- Migrations need different permissions than the web app.
- Deployment platform runs migration jobs and web services as different image
  classes.
- A future background worker is added for provider lookups, imports, or queues.

- [ ] **Step 2: Keep the first split to two app images**

Use:

- `auto-spendings-web`: contains `dist/`, production dependencies, PWA assets,
  and `npm run start`.
- `auto-spendings-migrator`: contains source database files, migrations,
  `scripts/migrate.ts`, `scripts/revert-migration.ts`, Node.js type stripping,
  and TypeORM.

PostgreSQL remains a separate official image or managed service.

- [ ] **Step 3: Preserve release order**

```text
build/pull migrator image
build/pull web image
backup database
run migrator once
restart web
smoke test
```

- [ ] **Step 4: Add a worker image only when a real worker exists**

Do not create a worker image for the current MVP. Add it only when provider
lookup, long-running imports, or scheduled jobs become real server-side code.

## Task 7: Demo-Only All-In-One Container

**Files:**

- Create only for demos: `docker/all-in-one.Dockerfile`

**Purpose:** Document the one physical container path without making it the
production default.

- [ ] **Step 1: Use this only for disposable demos**

An all-in-one image may run PostgreSQL and Node.js in one container only when:

- Data is disposable or externally backed up before every run.
- The container has a persistent volume for PostgreSQL data.
- There is no expectation of clean zero-downtime updates.
- Logs, health checks, and backups are acceptable as a single coupled unit.

- [ ] **Step 2: Prefer Compose even for demos**

For almost every demo, prefer the production Compose shape with local
`postgres:18-alpine`. It is still one command to start, but it preserves sane
process boundaries:

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml up --detach
```

## Final Verification

Run from `.` before calling deployment ready:

```bash
npm run build
npm run test
npm run test:integration
npm run lint
npm run typecheck
docker build -t auto-spendings-app:verify .
docker compose --env-file .env.deploy -f docker-compose.prod.yml config
```

Run from the root checkout:

```bash
git diff --check
```

The deployment plan is ready when the app can be built as one image, migrations
can run as a one-shot job, the app can restart without restarting PostgreSQL,
and the N-image split remains documented as a later optimization.

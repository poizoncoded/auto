# Task 1: Prerequisites And Workspace Baseline

**Source:** `plans/auto-spendings.md` sections "Local Verification",
"Development Principle", "Product Target", "Resolved Decisions", and "Security
Notes".

**Goal:** Confirm prerequisites, local PostgreSQL database readiness, the root
checkout, reproducible `plans/` and `tasks/` inputs, AI-driven delivery rule,
and protected product constraints before implementation starts.

**Files:**

- Read: `plans/auto-spendings.md`
- Read: `plans/auto-spendings-deploy.md`
- Read: `README.md`
- Read: `INSTALL.md`
- Read: `AGENTS.md`
- Read: `.codex/config.toml`
- Read: `tasks/README.md`
- Modify: none for a passing baseline

**Interfaces:**

- Consumes: root plans, root tasks, root documentation, and current Git status.
- Produces: a verified prerequisite, local database, and local baseline for
  Tasks 2-7.

## Steps

- [ ] **Step 1: Confirm root checkout**

```bash
pwd
git status --short --branch
```

Expected: `pwd` is `/Users/poizoncc/Work/poizoncoded/auto`; every changed or
untracked file is understood before continuing.

- [ ] **Step 2: Confirm prerequisite tools**

```bash
node --version
docker --version
docker compose version
npm view ruflo version
docker exec auto-spendings-postgres psql --version
docker port auto-spendings-postgres 5432/tcp
```

Expected: Node.js is `v24` or newer, Docker Engine is `29` or newer, Docker
Compose is `v5` or newer, npm resolves Ruflo, the Dockerized `psql` reports
PostgreSQL `18`, and PostgreSQL port `5432` is published from the container.

If any command is missing or below target, stop this task before Step 3 and
install prerequisites from `INSTALL.md`. Do not create app files, install
packages, run migrations, build images, deploy, run tests, or start Task 2.

- [ ] **Step 3: Confirm local PostgreSQL server and database**

```bash
docker exec auto-spendings-postgres pg_isready -U auto_spendings -d poizoncoded_auto
docker exec auto-spendings-postgres psql -U auto_spendings -d poizoncoded_auto -c 'select current_database();'
```

Expected: PostgreSQL accepts connections on `localhost:5432`, and the query
prints `poizoncoded_auto`.

If the server is missing or the database does not exist, stop this task before
Step 4 and use the Docker database setup from `INSTALL.md`. Do not create app
files, install packages, run migrations, build images, deploy, run tests, or
start Task 2.

- [ ] **Step 4: Confirm Ruflo harness configuration**

```bash
rg -n "ruflo|npx|mcp.*start|hooks_route|swarm_init|agent_spawn" .codex/config.toml AGENTS.md INSTALL.md
```

Expected: matches show Ruflo is configured as the preferred MCP harness and
resolved through `npx -y ruflo@latest mcp start`.

- [ ] **Step 5: Confirm the reproducibility rule**

```bash
rg -n "plans/.*tasks/|reproducible|Build by AI-driven development only|No hand-coded manual implementation edits|local app snapshots" README.md plans/auto-spendings.md tasks/README.md
```

Expected: matches show implementation is reproducible from committed plans and
tasks, AI-driven only, and not derived from local app snapshots.

- [ ] **Step 6: Confirm product input files**

```bash
test -f plans/auto-spendings.md
test -f plans/auto-spendings-deploy.md
test -f INSTALL.md
test -f tasks/README.md
test -f public/bg.png
find tasks -maxdepth 1 -name '*.md' -print | sort
```

Expected: the product plan, deployment plan, install guide, task index, README
visual, and all seven task files are present.

- [ ] **Step 7: Inventory app scaffold state**

```bash
find . -maxdepth 2 \( -name package.json -o -name 'astro.config.*' -o -name src -o -name docker-compose.yml \) -print
```

Expected before Task 2: no root app scaffold files. Expected after Task 2:
the command lists the generated scaffold files.

- [ ] **Step 8: Confirm privacy and provider constraints**

```bash
rg -n "Do not scrape|Never commit|six-digit PIN|RU-only|poizoncoded_auto|allowed integration path|mobile-first" README.md plans/auto-spendings.md tasks/README.md
```

Expected: matches show the no-scraping, no-secrets, PIN, RU-only, database,
provider-permission, and mobile-first constraints.

- [ ] **Step 9: Completion gate**

Record the command results in the task-run notes or commit message. Do not
start Task 2 until prerequisites, Ruflo harness configuration, local database
readiness, source-of-truth, AI-only, privacy, provider, and mobile-first
constraints are verified.

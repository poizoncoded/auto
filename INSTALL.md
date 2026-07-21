# Auto Spendings Install Guide

Status: prerequisite guide.
Verified on: 2026-07-21.

Use this guide before starting `tasks/01-workspace-baseline.md`. It prepares the
machine only; it does not create app files, install app packages, run
migrations, or deploy the app.

## What Gets Installed

- Node.js `24` or newer.
- Docker Engine `29` or newer with Docker Compose `v5` or newer.
- Ruflo resolved through `npx ruflo@latest` for agent orchestration.
- PostgreSQL `18` as a local Docker container named
  `auto-spendings-postgres`.
- Database `poizoncoded_auto`.

No host PostgreSQL install is required for the default path.
No global Ruflo install is required; `.codex/config.toml` starts Ruflo through
`npx -y ruflo@latest mcp start`.

## 1. Install Host Tools

macOS with Homebrew:

```bash
brew install node && brew install --cask docker-desktop
```

Windows with PowerShell:

```powershell
winget install -e --id OpenJS.NodeJS.LTS; winget install -e --id Docker.DockerDesktop
```

Ubuntu or Debian:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt-get install -y nodejs && curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && sudo systemctl enable --now docker
```

After installing Docker Desktop on macOS or Windows, open Docker Desktop once
and wait until `docker ps` works.

On Linux, if Docker requires `sudo`, add your user to the Docker group and open
a new shell:

```bash
sudo usermod -aG docker "$USER"
```

## 2. Start PostgreSQL

macOS or Linux:

```bash
docker start auto-spendings-postgres 2>/dev/null || docker run --detach --name auto-spendings-postgres --publish 5432:5432 --env POSTGRES_USER=auto_spendings --env POSTGRES_PASSWORD=auto_spendings_local --env POSTGRES_DB=poizoncoded_auto --volume auto-spendings-postgres:/var/lib/postgresql/data postgres:18-alpine
```

Windows with PowerShell:

```powershell
docker start auto-spendings-postgres 2>$null; if ($LASTEXITCODE -ne 0) { docker run --detach --name auto-spendings-postgres --publish 5432:5432 --env POSTGRES_USER=auto_spendings --env POSTGRES_PASSWORD=auto_spendings_local --env POSTGRES_DB=poizoncoded_auto --volume auto-spendings-postgres:/var/lib/postgresql/data postgres:18-alpine }
```

If port `5432` is already used by another PostgreSQL server, stop that server
before using this default guide. The reproducible Task 1 path expects the
Docker container above.

## 3. Verify Readiness

```bash
node --version
docker --version
docker compose version
npm view ruflo version
docker exec auto-spendings-postgres psql --version
docker port auto-spendings-postgres 5432/tcp
docker exec auto-spendings-postgres pg_isready -U auto_spendings -d poizoncoded_auto
docker exec auto-spendings-postgres psql -U auto_spendings -d poizoncoded_auto -c 'select current_database();'
```

Expected:

- Node.js prints `v24` or newer.
- Docker Engine prints `29` or newer.
- Docker Compose prints `v5` or newer.
- npm prints a Ruflo package version.
- PostgreSQL prints `18`.
- Docker publishes PostgreSQL port `5432`.
- The database query prints `poizoncoded_auto`.

Only after these checks pass may an AI agent continue to Task 2.

Optional Ruflo cache warm-up:

```bash
npx -y ruflo@latest --version
```

If `npx` fails with a local npm cache rename error such as `ENOTEMPTY`, run
`npm cache verify` and retry. If it still fails, run `npm cache clean --force`
and retry.

## Local Database URL

Use this value for local generated app configuration:

```text
postgres://auto_spendings:auto_spendings_local@localhost:5432/poizoncoded_auto
```

Do not commit `.env` files or real deployment secrets.

## References Checked

- Node.js download page: `https://nodejs.org/en/download`
- Docker Desktop install overview: `https://docs.docker.com/get-started/introduction/get-docker-desktop/`
- Docker Linux convenience script guidance: `https://docs.docker.com/engine/install/ubuntu/`
- Docker Compose install overview: `https://docs.docker.com/compose/install/`
- PostgreSQL Docker Official Image: `https://hub.docker.com/_/postgres`
- Ruflo GitHub repository: `https://github.com/ruvnet/ruflo`
- Ruflo install wiki: `https://github.com/ruvnet/ruflo/wiki/Installation`

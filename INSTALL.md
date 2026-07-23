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
- PostgreSQL `18` through the checked-in `docker-compose.yml` service, running
  as local Docker container `auto-spendings-postgres`.
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

## 2. Create Local Env And Start PostgreSQL

From the repository root on macOS, Windows, or Linux:

```bash
node -e "require('node:fs').copyFileSync('.env.example', '.env')"
```

```bash
docker compose up --detach --wait db
```

The database is published only on `127.0.0.1:5433`, not on the LAN. Port `5433`
keeps the Docker database separate from any host PostgreSQL already using
`5432`.

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
- Docker publishes PostgreSQL on `127.0.0.1:5433`.
- The database query prints `poizoncoded_auto`.

Only after these checks pass may an AI agent continue to Task 2.

If PostgreSQL answers with `password authentication failed for user
"auto_spendings"`, the Docker volume was probably initialized with older
credentials. For disposable local data, reset only this app database volume:

```bash
docker compose down
docker volume rm auto_auto_spendings_postgres_data
docker compose up --detach --wait db
```

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
postgres://auto_spendings:auto_spendings_local@localhost:5433/poizoncoded_auto
```

Do not commit `.env` files or real deployment secrets.

## Mobile Preview

For a real in-app camera on a phone, start the complete trusted HTTPS workflow:

```bash
npm run dev:https
```

Open the generated `https://*.trycloudflare.com/receipts` URL printed by the
`https` process. Alternatively, open the LAN HTTP app, choose Camera, and tap
`Открыть HTTPS-камеру`; the app discovers the current temporary address and
uses a short-lived, single-use development handoff to keep the unlocked profile
and open Camera directly over HTTPS. The command starts the frontend,
PostgreSQL/migrations, and a pinned `cloudflare/cloudflared` Docker container.
No second PIN entry, Cloudflare account, or host install is required.

The generated URL is temporary and publicly reachable while the command runs.
Use it only for development, avoid real private data, and stop the process when
testing is complete. If the app is already running on port `4321`, start only
the HTTPS bridge:

```bash
npm run dev:tunnel
```

For layout testing without a live camera, start the Astro/Vite server on the
LAN with `npm run dev:lan`, then open `http://<LAN-IP>:4321/dashboard`. On
macOS, `ipconfig getifaddr en0` usually prints the Wi-Fi LAN IP. On Linux, use
`hostname -I`. On Windows, use `ipconfig` and copy the active Wi-Fi IPv4
address.

If port `4321` is already occupied, use:

```bash
npm run dev:lan:alt
```

Then open `http://<LAN-IP>:4322/dashboard`.

Dev startup runs `npm run dev:rebuild`, clearing generated Astro/Vite state and
running `astro sync` before Vite binds to the network. Plain LAN HTTP cannot
access browser `getUserMedia`; Camera reports that HTTPS is required and links
to the active development tunnel when it is running. The link works only once,
expires after one minute, and never exposes the app session token. Photo and
manual QR-string import remain available there.

## References Checked

- Node.js download page: `https://nodejs.org/en/download`
- Docker Desktop install overview: `https://docs.docker.com/get-started/introduction/get-docker-desktop/`
- Docker Linux convenience script guidance: `https://docs.docker.com/engine/install/ubuntu/`
- Docker Compose install overview: `https://docs.docker.com/compose/install/`
- PostgreSQL Docker Official Image: `https://hub.docker.com/_/postgres`
- Cloudflare Quick Tunnels: `https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/`
- MDN `getUserMedia`: `https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia`
- Ruflo GitHub repository: `https://github.com/ruvnet/ruflo`
- Ruflo install wiki: `https://github.com/ruvnet/ruflo/wiki/Installation`

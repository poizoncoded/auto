# Auto Spendings

![Auto Spendings planning cover](public/bg.png)

![Status: AI Build Plan](https://img.shields.io/badge/Status-AI%20Build%20Plan-127B6E?style=for-the-badge)
![Experience: Mobile First](https://img.shields.io/badge/Experience-Mobile%20First-16A34A?style=for-the-badge)
![Host: Localhost](https://img.shields.io/badge/Host-Localhost-2563EB?style=for-the-badge)
![Stack: Astro + React](https://img.shields.io/badge/Stack-Astro%20%2B%20React-FF5D01?style=for-the-badge)
![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge)
![Locale: RU](https://img.shields.io/badge/Locale-RU-D52B1E?style=for-the-badge)

**A mobile-first, RU-only, localhost-first PWA for multi-user vehicle-spending
records.**

Auto Spendings is inspired by
[Codriver - Car Expense Tracker](https://apps.apple.com/ru/app/codriver-car-expense-tracker/id1565445958),
but it is not a clone. The target product is a compact mobile-first web app
for vehicle costs, Russian RUB formatting, PostgreSQL persistence, fiscal QR
review, exports, and safe local deployment.

## Development Principle

This project is built by AI-driven development only. Humans write and approve
intent, constraints, task flow, and review feedback; implementation changes are
generated and verified by AI agents. No hand-coded manual implementation edits
are part of the delivery workflow.

This root checkout is the source of truth. Build the application here from
`plans/` and `tasks/` only; do not treat any local alternate checkout or
previous app snapshot as a product reference.

The target must be reproducible by a fresh AI agent from the committed plans
and executable task flow. If a requirement is missing from those files, update
the plan or task first, then generate the implementation from that updated
source.

```text
Auto Spendings target architecture

Mobile-first user
  -> Astro PWA shell
  -> React workspaces for PIN, vehicles, spending, receipts, charts, exports
  -> Astro server endpoints
  -> TypeORM data mapper with EntitySchema metadata
  -> PostgreSQL database poizoncoded_auto
  -> Receipt provider interface
  -> Manual receipt review before expense creation
  -> Future automated provider only after documented permission
```

## Current State

Verified on 2026-07-21:

| Area | Status |
| --- | --- |
| Product direction | Mobile-first AI-driven webapp |
| Source of truth | Root checkout |
| App scaffold | Present in root |
| Package metadata | `package.json` and `package-lock.json` |
| Source tree | `src/` |
| Database | PostgreSQL `poizoncoded_auto` through Docker Compose |
| README visual | `public/bg.png` |
| Install guide | `INSTALL.md` |
| Deployment plan | `plans/auto-spendings-deploy.md` |
| Task flow | `tasks/` |
| Agent harness | Ruflo through `npx -y ruflo@latest mcp start` |
| Agent context | Hidden local `.codex/` and `.claude/` assets exist |

## Mobile-First Requirements

| Surface | Requirement |
| --- | --- |
| Primary viewport | Design first for 390px mobile width |
| Navigation | Thumb-friendly, no dense desktop-only sidebars |
| Forms | Fast entry for fuel, charging, expenses, vehicles, and receipts |
| Scanner | Browser QR scanning must work from a phone camera flow |
| Dashboard | Compact totals, trends, category split, and efficiency cards |
| Desktop | Responsive enhancement after the mobile flow works |

## MVP Behavior

The AI-built MVP should include:

| Capability | First Release Behavior |
| --- | --- |
| Users | User registration, login, opaque sessions, and user-owned data boundaries |
| Privacy lock | Six-digit PIN setup, unlock, lock, and authenticated PIN change |
| Vehicles | CRUD with type, fuel or energy unit, odometer unit, and RUB default |
| Categories | User-owned expense categories with icon, color, sort order, and type |
| Spending | Expense CRUD with fuel and charging details, odometer, cost, and notes |
| Dashboard | Totals, monthly trend, category split, distance, and efficiency metrics |
| Receipts | Browser QR scan, fiscal payload parsing, pending review, expense save |
| Export | User-owned CSV and JSON export endpoints |
| Offline | Static offline fallback plus device-local queue for new expenses |

Use TypeORM `EntitySchema` targets instead of decorators, so the app has no
direct `reflect-metadata` dependency, import, or TypeScript decorator metadata
flags. TypeORM may still install `reflect-metadata` transitively in its own
dependency tree.

Income tracking, delivery revenue, reimbursements, Telegram, subscriptions,
cross-device sync, home-screen widgets, and automatic fiscal-provider lookup
are outside this MVP.

## Receipt Import

Receipt lookup remains the riskiest external integration. The app presents a
source picker first, with Camera before Photo and manual QR-string input. It
decodes QR images and secure live-camera frames with `jsqr`, stores validated
pending receipt rows on the server, and creates expenses only after user review.
Camera starts a live `getUserMedia` preview only on a trusted HTTPS origin;
Photo is the explicit file or media-library fallback.

Uploaded-image regression coverage uses an independently generated Russian
fiscal payload inside a 514x410 screenshot, a compact code, and a rotated code
at the current 40% minimum contrast boundary. A passing decode must also parse
into the expected fiscal date, amount, FN, FD, FP, and operation type.

Taxcom remains a manual verification candidate through `receipt.taxcom.ru`.
The app must not scrape Taxcom or any fiscal provider, bypass rate limits,
CAPTCHAs, access controls, or terms. Automated lookup should be added only
after a provider documents or grants an allowed integration path.

Imported receipt data is untrusted until the user reviews it.

## Security

A six-digit PIN is a privacy lock, not full authentication. The MVP must hash
PINs with a slow password-hashing algorithm, store opaque session-token hashes
server-side, and scope every personal-data endpoint to the current user.

Never commit `.env`, database URLs, bot tokens, Obscura credentials, receipt
samples, database dumps, or private spending data.

## Install

Use [INSTALL.md](INSTALL.md) before generating or running the app. Targets
checked on 2026-07-21.

This is a hard gate. Until it passes, the only allowed work is installing or
upgrading prerequisites, starting or creating the local PostgreSQL database, and
updating planning docs. Do not start the build flow, Task 2, app scaffolding,
package installs, Docker image work, migrations, deployment, or tests until the
readiness checks below pass.

| Tool | Required For |
| --- | --- |
| Node.js 24+ | npm scripts, Astro, React, tests, and migration runners |
| Docker with Compose v5+ | local deployment checks and production-like stack |
| Ruflo through npx | AI agent orchestration, memory, hooks, and swarm tools |
| PostgreSQL 18 Docker Compose service | local database and migration verification |

Readiness check:

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

Expected: PostgreSQL accepts connections through `localhost:5433`, and
`poizoncoded_auto` exists. A PostgreSQL client alone is not enough; the default
path runs the real PostgreSQL server through Docker Compose.

## Build Flow

Start this section only after the prerequisite and local database readiness
gate passes.

Use the task flow as the execution path. A reproducible build starts from the
root `plans/` and `tasks/` files:

```bash
ls plans tasks
```

Expected app checks:

```bash
npm run build
npm run test
npm run test:integration
npm run lint
npm run typecheck
git diff --check
```

Real mobile-camera development:

```bash
npm run dev:https
```

This starts the frontend, PostgreSQL/migrations, and a pinned Cloudflare Quick
Tunnel container. Open the generated `https://*.trycloudflare.com/receipts`
URL printed by the `https` process. You can also open the LAN HTTP app, choose
Camera, and tap `Открыть HTTPS-камеру`; the development UI discovers the
current tunnel, transfers the unlocked profile through a short-lived one-time
development token, and opens the live scanner directly. The trusted HTTPS
origin exposes `getUserMedia`; no second PIN entry or repeated Camera selection
is required.

The Quick Tunnel URL is temporary and publicly reachable while the command is
running. Use it only for development, do not enter real private data, and stop
the process when testing is complete. If the app is already running on port
`4321`, start only the HTTPS bridge with `npm run dev:tunnel`.

For layout checks that do not need a live camera, use `npm run dev:lan` and
open `http://<LAN-IP>:4321/dashboard`. If `4321` is occupied, use
`npm run dev:lan:alt` and port `4322`.

Frontend dev first runs `npm run dev:rebuild`, which removes generated
Astro/Vite state and runs `astro sync`. Plain LAN HTTP cannot use browser
`getUserMedia`; Camera explains that HTTPS is required and links to the active
development tunnel instead of presenting a file picker as a camera. The handoff
never puts the long-lived session cookie in the URL. Photo and QR string remain
available on HTTP.

## Documentation

| Document | When To Read It |
| --- | --- |
| `README.md` | Current product charter and AI-development rules |
| `INSTALL.md` | Simplest prerequisite and local database setup |
| `plans/auto-spendings.md` | Verified product plan, implementation status, and remaining risks |
| `plans/auto-spendings-deploy.md` | Docker deployment and migration plan |
| `tasks/README.md` | Executable AI-driven task flow |
| `AGENTS.md` | Agent-facing repository guidance |

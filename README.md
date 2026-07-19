# Auto Spendings

![Auto Spendings planning cover](public/image.png)

![Status: Planning](https://img.shields.io/badge/Status-Planning-111827?style=for-the-badge)
![Host: Localhost](https://img.shields.io/badge/Host-Localhost-2563EB?style=for-the-badge)
![Stack: Astro + React](https://img.shields.io/badge/Stack-Astro%20%2B%20React-FF5D01?style=for-the-badge)
![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge)
![Locale: RU](https://img.shields.io/badge/Locale-RU-D52B1E?style=for-the-badge)

**A planned RU-only vehicle spending PWA for multi-user expense tracking.**

> Auto Spendings is inspired by
> [Codriver - Car Expense Tracker](https://apps.apple.com/ru/app/codriver-car-expense-tracker/id1565445958),
> but it is not a clone. The goal is a localhost-first Astro PWA with clearer
> receipt import, multi-user boundaries, and PostgreSQL persistence.

One workspace gives the app plan, local PoizonCoded agent guidance, and the
first implementation constraints: localhost runtime, database
`poizoncoded_auto`, RU formatting, six-digit PIN privacy locks, and fiscal
receipt lookup through provider integrations.

```text
Auto Spendings localhost architecture

User
  -> Astro PWA shell
  -> React islands for PIN, forms, charts, and QR scanner
  -> Astro server endpoints
  -> PostgreSQL database poizoncoded_auto
  -> Receipt provider interface
  -> Taxcom manual verification candidate
  -> Automated provider to be selected after a documented integration check
```

> Current state: planning only. There is no runnable app scaffold yet.

## Use This Repo

There are two useful paths, depending on whether you are reading the plan or
starting implementation.

| Path | Plan The App | Build The App |
| --- | --- | --- |
| Goal | Keep decisions current | Create the MVP |
| Source | `plans/auto-spendings.md` | Future app files |
| Runtime | Proposed localhost target | Local PostgreSQL |
| First check | README and plan agree | Build and test |

## Current State

Verified on 2026-07-19:

| Area | Status |
| --- | --- |
| App scaffold | Missing |
| Package metadata | No root `package.json` yet |
| Source tree | No `src/` yet |
| Database | Proposed PostgreSQL `poizoncoded_auto` |
| Hosting | Localhost for now |
| Agent context | Present under `.codex/` and `.claude/` |
| Cover image | `public/image.png` from `poizoncoded/skills` |

## MVP Direction

| Capability | First Release Behavior |
| --- | --- |
| Users | Multi-user data ownership |
| Privacy lock | Per-user six-digit PIN gate |
| Locale | RU-only formatting |
| Vehicles | CRUD with fuel or energy units |
| Spending | Expense, fuel, and charging entries |
| Dashboard | Totals, trends, category split, and efficiency |
| Receipts | QR scan plus reviewed import |
| Export | CSV or JSON user backup |

Income tracking is not in the current MVP. The Codriver reference does not
describe it, and a fiscal receipt's `Income` type belongs to the seller's
transaction rather than the user's finances.

Deferred for the first release:

| Deferred Item | Notes |
| --- | --- |
| Telegram bot | Out of MVP scope |
| Subscriptions | No payment flow yet |
| Sync | No cross-device sync yet |
| Widgets | Only normal PWA installability |
| Production hosting | Defer until localhost MVP works |

## Planned Stack

| Layer | Decision |
| --- | --- |
| Frontend | Astro with React islands |
| App structure | Astro routes plus Feature-Sliced Design |
| PWA | Installable shell with offline-first viewing |
| Runtime | TypeScript |
| Database | PostgreSQL |
| Persistence | TypeORM migrations unless evidence changes |
| Receipt lookup | Server-side provider interface |
| Taxcom | Manual verification candidate via `receipt.taxcom.ru` |
| First automated provider | To be selected after an allowed API check |
| Obscura | Not in MVP; evaluate only for permitted automation |

## Receipt Import

Receipt lookup must start with a spike. The app should decode QR payloads in the
browser, validate and store pending receipt rows on the server, then route
lookup through a provider interface. Taxcom's public checker accepts an FPD,
exact amount, and optional date for receipts sent through Taxcom; treat it as a
manual verification fallback, not an assumed automated import API. The first
automated provider must offer a documented, allowed integration path.

Do not bypass rate limits, CAPTCHAs, access controls, or terms. Imported
receipt data is untrusted until the user reviews it.

## Security

A six-digit PIN is a privacy lock, not full authentication. Because the first
release is multi-user, the app must also include real server-side session
boundaries before exposing personal spending data.

Never commit database URLs, bot tokens, Obscura credentials, receipt samples, or
private spending data.

## Development

There are no app commands yet because the scaffold has not been created.

Expected checks once the scaffold exists:

```bash
npm run build
npm run test
npm run lint
npm run typecheck
git diff --check
```

The MVP should also verify migration up/down against PostgreSQL database
`poizoncoded_auto`, browser behavior on desktop and mobile localhost viewports,
PWA installability, offline behavior, QR import, and RU-only locale formatting.

## Documentation

| Document | When To Read It |
| --- | --- |
| `README.md` | Human-facing overview |
| `AGENTS.md` | Agent-facing repository guidance |
| `plans/auto-spendings.md` | Verified build plan and risks |

## Local Agent Context

This workspace includes PoizonCoded agent guidance under `.codex/` and
`.claude/`.

| Skill | Use |
| --- | --- |
| `feature-sliced-design` | Astro/FSD layout and imports |
| `react-best-practices` | React islands, scanner UI, forms, and charts |
| `node` | TypeScript runtime, environment, errors, and tests |
| `typeorm` | Entities, migrations, repositories, and transactions |
| `nest` or `fastify` | Backend split if Astro endpoints are not enough |
| `browser` | Browser checks for scanner and PWA flows |
| `verification-quality` | Pre-completion evidence |

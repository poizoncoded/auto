# Auto Spendings

Status: planning.
Verified on: 2026-07-19.

Auto Spendings is a planned multi-user, RU-only vehicle spending tracker. The
app will be built as an Astro PWA with React islands, PostgreSQL persistence,
and QR receipt import. It uses
[Codriver - Car Expense Tracker](https://apps.apple.com/ru/app/codriver-car-expense-tracker/id1565445958)
as product inspiration, not as a clone target.

The detailed build plan is in
[plans/auto-spendings.md](plans/auto-spendings.md).

## Current State

No runnable application scaffold exists yet. This repository currently has no
root `package.json`, no `src/`, no Astro config, no database migrations, no
Docker compose file, and no test suite.

The first implementation target is localhost with a local PostgreSQL database
named `poizoncoded_auto`.

## Product Direction

The first release should include:

- Multi-user data ownership with per-user vehicle, category, expense, and
  receipt data.
- Per-user six-digit PIN privacy lock.
- RU-only date, number, unit, and RUB currency formatting.
- Vehicle, category, expense, fuel, and charging entry management.
- Dashboard totals, monthly trend, category split, efficiency, and cost per
  distance metrics.
- Browser QR scanning for fiscal receipt import.
- Provider-based receipt lookup so Taxcom is not hard-coded as the only source.
- CSV or JSON export for user-owned backups.

Deferred for the first release:

- Telegram bot.
- Subscription or payment features.
- Cross-device sync.
- PWA home-screen widgets beyond normal installability.
- Production hosting decisions.

## Planned Stack

- Frontend: Astro with React islands.
- App structure: Astro routes in `src/pages/` and Feature-Sliced Design app
  code under `src/_pages/`, `src/widgets/`, `src/features/`, `src/entities/`,
  and `src/shared/`.
- PWA: installable shell with offline-first viewing and offline entry queue.
- Database: PostgreSQL.
- Persistence: TypeORM migrations unless implementation evidence points to a
  better local pattern.
- Runtime: TypeScript.
- Receipt automation spike: evaluate
  [`h4ckf0r0day/obscura`](https://github.com/h4ckf0r0day/obscura) only as a
  server-side headless browser option for an allowed provider integration path.

## Receipt Import Notes

Receipt lookup must start with a spike. The app should decode QR payloads in the
browser, validate and store pending receipt rows on the server, then route lookup
through a provider interface. Taxcom is the first known provider candidate via
`https://receipt.taxcom.ru/`, but the implementation must verify an allowed
lookup path and must not bypass rate limits, CAPTCHAs, access controls, or
terms.

Imported receipt data is untrusted until the user reviews it.

## Security Notes

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
PWA installability and offline behavior, QR receipt import, and RU-only locale
formatting.

## Local Agent Context

This workspace includes PoizonCoded agent guidance under `.codex/` and
`.claude/`. Relevant implementation skills include `feature-sliced-design`,
`react-best-practices`, `node`, `typeorm`, `nest`, `fastify`, `browser`, and
`verification-quality`.

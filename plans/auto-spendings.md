# Auto Spendings Build Plan

Status: proposed.
Verified on: 2026-07-19.
Document type: rough plan under `plans/`.

## Baseline

Use the App Store listing for
[Codriver - Car Expense Tracker](https://apps.apple.com/ru/app/codriver-car-expense-tracker/id1565445958)
as product inspiration, not as a clone target.

Verified baseline features from the listing:

- Vehicle expense tracking for fuel, charging, maintenance, parking, leasing,
  and custom categories.
- Metrics for total spend, monthly spend, category spend, fuel efficiency, EV
  energy efficiency, cost per month, and cost per distance.
- Monthly/category charts.
- Multiple vehicles.
- Offline use, import/export, locale and currency support.
- Device widgets and iCloud sync in the original app. These are reference
  features only; the PWA should solve the same user problems in its own way.

## Local Verification

Verified in this workspace on 2026-07-19:

- No application scaffold exists yet. There is no root `package.json`, no
  `src/`, no Astro config, no database migrations, no Docker compose file, and
  no tests.
- The root files currently relevant to this plan are `README.md`, `AGENTS.md`,
  `.gitignore`, `.codex/config.toml`, `.claude/settings.json`, and this file.
- `.codex/config.toml` configures Ruflo as the preferred MCP harness, but
  ToolSearch exposed no Ruflo tools in this session.
- `.claude/settings.json` allows local development commands that the future app
  will likely need, including `npm`, `npx`, `node`, `vite`, `vitest`, `tsc`,
  `psql`, `docker`, `curl`, `jq`, and `rg`.
- Relevant shared skills exist under both `.codex/skills/` and
  `.claude/skills/`: `react-best-practices`, `feature-sliced-design`, `node`,
  `nest`, `typeorm`, `fastify`, `browser`, and `verification-quality`.
- No dedicated local skill was found for PWA implementation, Telegram bot
  implementation, QR scanning, Taxcom receipt lookup, receipt OCR, or Obscura.

## Product Target

Build a new React-based Astro PWA for vehicle spending, better suited to this
workspace than a direct native-app copy.

Required product decisions:

- Frontend: Astro with React islands for interactive surfaces.
- PWA: installable shell with offline-first viewing and offline entry queue.
- Database: PostgreSQL database named `poizoncoded_auto`.
- Privacy lock: simple six-digit PIN gate.
- Receipt capture: browser QR scanner that decodes receipt QR payloads and
  turns them into reviewed expense records.
- Taxcom: use `https://receipt.taxcom.ru/` only through a verified, allowed
  integration path.
- Obscura: intentionally proposed but not verified. Confirm the exact Obscura
  product, package, API, credentials model, and allowed usage before
  implementation.
- Telegram bot: deferred and out of MVP scope.

## MVP Scope

Ship these first:

- Six-digit PIN setup, unlock, lock, and reset flow.
- Vehicle CRUD with name, type, fuel or energy unit, odometer unit, and default
  currency.
- Category CRUD with icon, color, and category type.
- Expense CRUD for fuel, charging, maintenance, parking, insurance, lease,
  parts, wash, tolls, and custom categories.
- Fuel and charging entries with odometer, volume or energy amount, total cost,
  unit price, and efficiency calculations.
- QR receipt import: scan, decode, fetch or derive fiscal receipt details,
  show a review screen, then save as an expense.
- Dashboard with totals, monthly trend, category split, distance driven, fuel
  efficiency, energy efficiency, and cost per distance.
- CSV or JSON export for user-owned backup.

Defer these:

- Telegram bot.
- Multi-user accounts.
- Subscription/payment features.
- iCloud-like cross-device sync.
- Home-screen widgets beyond normal PWA installability.

## Architecture

Start with a single Astro application unless the backend grows enough to justify
a separate API service.

Frontend layout:

- Use Astro routes in `src/pages/` as thin route entry points.
- Use Feature-Sliced Design inside `src/`, with Astro route-level page slices
  under `src/_pages/` because Astro owns `src/pages/`.
- Use React islands for PIN keypad, QR scanner, forms, charts, sync status, and
  other interactive widgets.
- Use the official Astro React integration. Astro documents `npx astro add
  react` for adding `@astrojs/react`.
- Use a PWA integration such as `@vite-pwa/astro`, or a hand-written manifest
  and service worker if compatibility requires it during implementation.

Backend and persistence:

- Use TypeScript throughout.
- Use TypeORM migrations for PostgreSQL persistence unless implementation
  evidence later proves another local pattern is better.
- Keep database access behind server-side endpoints. Do not connect directly to
  PostgreSQL from browser code.
- Keep environment values in `.env` locally and commit only `.env.example`.
- If the API becomes larger than Astro endpoints should carry, split the server
  into a NestJS or Fastify service and keep Astro as the PWA frontend.

Initial database tables:

- `pin_credentials`: PIN hash metadata, never plaintext PIN.
- `vehicles`: vehicle profile, units, currency, archived state.
- `categories`: user-defined expense categories, icon, color, sort order.
- `expenses`: normalized spending record with amount, currency, date, category,
  vehicle, notes, and receipt link.
- `fuel_entries`: fuel or energy details tied to an expense.
- `receipts`: decoded QR payload, provider, fiscal fields, fetch status, raw
  response metadata, and review state.
- `receipt_items`: optional line items imported from a verified receipt source.

## QR And Taxcom Flow

Implementation must begin with a spike, because this is the riskiest unknown.

Target flow:

1. User opens the scanner React island.
2. Browser camera scans the receipt QR code.
3. Client decodes the QR payload.
4. Server validates the decoded fields and stores a pending `receipts` row.
5. Server uses the verified Taxcom-compatible path to retrieve receipt details.
6. User reviews merchant, date, total, category, vehicle, and line items.
7. User saves the reviewed receipt as an expense.

Rules for the spike:

- Confirm the QR payload format with real sample receipts before hard-coding
  parser assumptions.
- Confirm whether Taxcom allows automated lookup from this app. Prefer an
  official API or documented endpoint. Do not bypass rate limits, CAPTCHAs,
  access controls, or terms.
- Confirm what "Obscura" means before depending on it. If it is an OCR or
  document extraction service, add its docs, credentials, data-retention model,
  and fallback behavior to this plan before implementation.
- Treat imported receipt data as untrusted until the user reviews it.

## Security Notes

- A six-digit PIN is a privacy lock, not full authentication by itself.
- Hash the PIN with a slow password-hashing algorithm and never store the PIN in
  plaintext.
- If the app is deployed beyond a local single-user environment, add a real
  server-side session boundary before exposing personal spending data.
- Store receipt images only if required. Prefer storing structured receipt
  fields and user-reviewed data.
- Do not commit database URLs, bot tokens, Obscura credentials, receipt samples,
  or private spending data.

## Skill Use During Implementation

Use the smallest relevant skill set per phase:

- `feature-sliced-design`: Astro/FSD layout, route placement, public APIs, and
  import boundaries.
- `react-best-practices`: React islands, forms, scanner component, charts, and
  render/bundle performance.
- `node`: TypeScript runtime, environment parsing, logging, errors, graceful
  shutdown, and tests.
- `typeorm`: entities, migrations, repositories, transactions, and persistence
  tests.
- `nest` or `fastify`: only if the backend is split out of Astro endpoints.
- `browser`: browser automation checks for the scanner and PWA flows.
- `verification-quality`: pre-completion verification plan and evidence.

## Acceptance Checks

Before calling the MVP complete:

- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- Migration up/down against PostgreSQL database `poizoncoded_auto`.
- Browser checks for desktop and mobile viewports.
- PWA installability and offline behavior check.
- QR import test with synthetic and user-approved sample receipt payloads.
- `git diff --check`

These commands are future checks. They cannot pass yet because the app scaffold
does not exist.

## Open Questions

- What exactly is Obscura: package, service, internal tool, or API?
- Should the first release be single-user local-only, single-user remote, or
  multi-user?
- Which hosting target should drive the Astro adapter and database connection
  model?
- Should all receipt lookup traffic go through Taxcom, or should the app
  support multiple fiscal receipt providers later?
- Which currencies and locales are required for the first release?

## Evidence

Local evidence:

- `AGENTS.md`
- `README.md`
- `.gitignore`
- `.codex/config.toml`
- `.claude/settings.json`
- `.codex/skills/verify-md/SKILL.md`
- `.codex/skills/verify-md/references/conventions.md`
- `.codex/skills/poizoncoded-conventions/SKILL.md`
- `.codex/skills/feature-sliced-design/SKILL.md`
- `.codex/skills/feature-sliced-design/references/framework-integration.md`
- `.codex/skills/react-best-practices/SKILL.md`
- `.codex/skills/node/SKILL.md`
- `.codex/skills/typeorm/SKILL.md`
- `.codex/skills/nest/SKILL.md`
- `.codex/skills/fastify/SKILL.md`

External evidence checked on 2026-07-19:

- `https://apps.apple.com/ru/app/codriver-car-expense-tracker/id1565445958`
- `https://receipt.taxcom.ru/`
- `https://docs.astro.build/en/guides/integrations-guide/react/`
- `https://vite-pwa-org.netlify.app/frameworks/astro`

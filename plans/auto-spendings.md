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
- No personal or vehicle income-tracking capability is described in the
  listing. It is outside the current MVP unless explicitly added later.

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
  implementation, QR scanning, Taxcom receipt lookup, or receipt OCR.
- Obscura is not a local skill or OCR service. The supplied repository,
  `h4ckf0r0day/obscura`, is an open-source Rust headless browser for AI agents
  and web scraping with Chrome DevTools Protocol compatibility.

## Product Target

Build a new React-based Astro PWA for vehicle spending, better suited to this
workspace than a direct native-app copy.

Required product decisions:

- Frontend: Astro with React islands for interactive surfaces.
- PWA: installable shell with offline-first viewing and offline entry queue.
- Database: PostgreSQL database named `poizoncoded_auto`.
- Hosting target: localhost for now.
- Users: multi-user first release with isolated user-owned vehicle, category,
  expense, and receipt data.
- Privacy lock: per-user simple six-digit PIN gate.
- Locale and currency: RU-only first release with Russian locale assumptions
  and Russian ruble amounts.
- Receipt capture: browser QR scanner that decodes receipt QR payloads and
  turns them into reviewed expense records.
- Receipt providers: support multiple fiscal receipt providers. Taxcom is the
  first known verification candidate: its public checker accepts an FPD, exact
  amount, and optional date for receipts sent through Taxcom. It is not a
  confirmed automated import API, so the first automatic provider remains
  undecided and must use a documented, allowed integration path.
- Obscura: use `h4ckf0r0day/obscura` only as a proposed server-side headless
  browser option for a later, explicitly permitted provider integration. It is
  not a receipt parser, is not part of the MVP, and must not be used to bypass
  rate limits, CAPTCHAs, access controls, or terms.
- Telegram bot: deferred and out of MVP scope.

## MVP Scope

Ship these first:

- Six-digit PIN setup, unlock, lock, and reset flow.
- User creation, user selection or login, and strict data ownership boundaries.
- Vehicle CRUD with name, type, fuel or energy unit, odometer unit, and default
  currency.
- RU-only formatting for dates, numbers, currencies, and default units.
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

Do not add a personal-income, vehicle-revenue, reimbursement, or delivery
earnings flow without a separate product decision. A fiscal document's
`Income` operation type describes the seller's transaction, not an Auto
Spendings user's income.

Defer these:

- Telegram bot.
- Subscription/payment features.
- iCloud-like cross-device sync.
- Home-screen widgets beyond normal PWA installability.

## Architecture

Start with a single Astro application unless the backend grows enough to justify
a separate API service.

The first runtime target is localhost. Optimize the initial app for local
development and local PostgreSQL, and defer production-specific Astro adapters,
reverse proxy rules, and managed database connection choices until a real
hosting target is chosen.

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
- Keep receipt provider integrations behind a server-side provider interface so
  Taxcom and later providers share one reviewed import flow.
- If the API becomes larger than Astro endpoints should carry, split the server
  into a NestJS or Fastify service and keep Astro as the PWA frontend.

Initial database tables:

- `users`: identity, display name, status, and audit timestamps.
- `pin_credentials`: per-user PIN hash metadata, never plaintext PIN.
- `vehicles`: vehicle profile, units, currency, archived state.
- `categories`: user-defined expense categories, icon, color, sort order.
- `expenses`: normalized spending record with amount, currency, date, category,
  vehicle, notes, and receipt link.
- `fuel_entries`: fuel or energy details tied to an expense.
- `receipts`: decoded QR payload, provider, fiscal fields, fetch status, raw
  response metadata, and review state.
- `receipt_items`: optional line items imported from a verified receipt source.
- `receipt_providers`: provider key, display name, supported QR fields, enabled
  state, and integration metadata.

## QR And Taxcom Flow

Implementation must begin with a spike, because this is the riskiest unknown.

Target flow:

1. User opens the scanner React island.
2. Browser camera scans the receipt QR code.
3. Client decodes the QR payload.
4. Server validates the decoded fields and stores a pending `receipts` row.
5. Server uses a matching provider only through its verified, allowed path. If
   no automated path is available, it preserves the decoded payload for manual
   review instead of scraping a public website.
6. User reviews merchant, date, total, category, vehicle, and line items.
7. User saves the reviewed receipt as an expense.

Rules for the spike:

- Confirm the QR payload format with real sample receipts before hard-coding
  parser assumptions.
- Treat the public Taxcom checker as a manual verification fallback until
  Taxcom documents or grants an automated consumer integration. Its published
  account API uses a session token and access to a cash register; it is not
  evidence of public consumer API access. Do not bypass rate limits, CAPTCHAs,
  access controls, or terms.
- Model receipt lookup as a provider strategy from the start. Taxcom should not
  be hard-coded as the only possible fiscal provider.
- Evaluate `h4ckf0r0day/obscura` only after a provider explicitly permits the
  automation. Keep it outside browser client code and do not treat it as OCR.
- Treat imported receipt data as untrusted until the user reviews it.

## Security Notes

- A six-digit PIN is a privacy lock, not full authentication by itself.
- Hash the PIN with a slow password-hashing algorithm and never store the PIN in
  plaintext.
- Because the first release is multi-user, add a real server-side session
  boundary before exposing personal spending data. The PIN gates access inside a
  user account; it does not replace identity and session management.
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
- Browser checks for desktop and mobile viewports on localhost.
- PWA installability and offline behavior check.
- QR import test with synthetic and user-approved sample receipt payloads.
- RU-only locale check: Russian date/number formatting and RUB currency output.
- `git diff --check`

These commands are future checks. They cannot pass yet because the app scaffold
does not exist.

## Resolved Decisions

- Resolved on 2026-07-19: Obscura is
  `https://github.com/h4ckf0r0day/obscura`, an open-source Rust headless
  browser for AI agents and web scraping.
- Resolved on 2026-07-19: the first release is multi-user with a per-user
  six-digit PIN privacy lock.
- Resolved on 2026-07-19: localhost is the hosting target for now.
- Resolved on 2026-07-19: receipt lookup should support multiple fiscal receipt
  providers, not only Taxcom.
- Resolved on 2026-07-19: the first release is RU-only for locale and currency.
- Verified on 2026-07-19: Taxcom's public checker is limited to receipts sent
  through Taxcom and accepts FPD, exact amount, and optional date. It is a
  manual verification fallback, not a confirmed automated provider.
- Pending: income tracking is not part of the reference product or current
  scope. Define its meaning before adding it to the MVP.

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
- `https://taxcom.ru/baza-znaniy/onlaynkassy-i-ofd/stati/ofd-kak-nayti-i-proverit-chek/`
- `https://lk-ofd.taxcom.ru/ApiHelp/spisok_dokumentov_po_smene_print.html`
- `https://lk-ofd.taxcom.ru/ApiHelp/pechat_dokumenta_v_pdf_formate.html`
- `https://github.com/h4ckf0r0day/obscura`
- `https://docs.astro.build/en/guides/integrations-guide/react/`
- `https://vite-pwa-org.netlify.app/frameworks/astro`

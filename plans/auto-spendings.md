# Auto Spendings Build Plan

Status: proposed mobile-first AI-driven webapp; root checkout contains planning
docs, deployment plan, task flow, README visual asset, and agent guidance.
Verified on: 2026-07-21.
Document type: rough plan under `plans/`.

## Baseline

Use the App Store listing for
[Codriver - Car Expense Tracker](https://apps.apple.com/ru/app/codriver-car-expense-tracker/id1565445958)
as product inspiration, not as a clone target.

Verified baseline features from the listing on 2026-07-21:

- Vehicle expense tracking for fuel, charging, maintenance, parking, leasing,
  and custom categories.
- Metrics for total spend, monthly spend, category spend, fuel efficiency, EV
  energy efficiency, cost per month, and cost per distance.
- Monthly and category charts.
- Multiple vehicles.
- Offline use, import/export, locale and currency support.
- Recurring expense rules and an average fuel-price metric are reference
  features, not MVP scope unless explicitly adopted later.
- Device widgets and iCloud sync are reference features only.
- No personal or vehicle income-tracking capability is described in the
  listing. It is outside the current MVP unless explicitly added later.

## Local Verification

Verified in this workspace on 2026-07-21:

- The root checkout has no application scaffold yet: no root `package.json`,
  no `src/`, no Astro config, no Docker Compose file, and no committed tests.
- `INSTALL.md` now carries the simple prerequisite guide: install host Node.js
  and Docker, verify Ruflo package access through npm, then run PostgreSQL 18
  as a local Docker container.
- Product implementation is intentionally reproducible from `plans/` and
  `tasks/` only. `README.md` summarizes the contract, and agent config files
  constrain how the AI workers operate.
- Prerequisites are a hard gate. Until they pass, the only allowed work is
  installing or upgrading prerequisites, starting or creating the local
  PostgreSQL database, rerunning the readiness checks, and updating planning
  docs. No app files, npm installs, migrations, Docker images, tests, or
  deployment work should start until `README.md` prerequisite and local database
  readiness checks pass and Task 1 records the evidence.
- The root files currently relevant to this plan are `README.md`, `INSTALL.md`,
  `AGENTS.md`, `.gitignore`, `.codex/config.toml`, `.claude/settings.json`,
  `public/bg.png`, `plans/auto-spendings-deploy.md`, `tasks/`, and this file.
- `.codex/config.toml` configures Ruflo as the preferred MCP harness with
  `npx -y ruflo@latest mcp start`, but ToolSearch exposed no Ruflo tools in
  this session.
- `.claude/settings.json` allows local development commands that the app will
  need, including `npm`, `npx`, `node`, `vite`, `vitest`, `tsc`, `psql`,
  `docker`, `curl`, `jq`, and `rg`.
- Relevant shared skills exist under both `.codex/skills/` and
  `.claude/skills/`: `react-best-practices`, `feature-sliced-design`, `node`,
  `nest`, `typeorm`, `fastify`, `browser`, and `verification-quality`.
- No dedicated local skill was found for PWA implementation, Telegram bot
  implementation, QR scanning, Taxcom receipt lookup, or receipt OCR.
- Obscura is not a local skill or OCR service. `h4ckf0r0day/obscura` is an
  open-source Rust headless browser for AI agents and web scraping with Chrome
  DevTools Protocol compatibility.

## Development Principle

Build the app by AI-driven development only. Humans provide product intent,
constraints, review feedback, and approval; AI agents generate implementation
changes, run checks, and update evidence. Do not rely on hand-coded manual
implementation edits as part of the delivery workflow.

This root checkout is the product source of truth. Future app files should be
created here from the committed `plans/` and `tasks/` files only. Temporary
scratch spaces may be used only for generated experiments and must not become
the product reference or repair target.

If an implementation detail is not reproducible from `plans/` or `tasks/`, add
it to the relevant plan or task before generating code.

## Product Target

Build a mobile-first React-based Astro PWA for vehicle spending, better suited
to this workspace than a direct native-app copy.

Required product decisions:

- Frontend: Astro with React islands for interactive surfaces.
- Experience: mobile-first, optimized first for a 390px phone viewport, then
  enhanced responsively for desktop.
- PWA: installable shell, static offline fallback, and device-local offline
  queue for unsent new expense entries. Authenticated API responses are not
  cached by the service worker.
- Database: PostgreSQL database named `poizoncoded_auto`.
- Local database readiness: the default local install runs PostgreSQL 18 through
  Docker container `auto-spendings-postgres`; Task 1 must prove a PostgreSQL 18
  server is accepting connections and the `poizoncoded_auto` database exists.
- Hosting target: localhost for the first MVP.
- Runtime dependency targets checked on 2026-07-21: Node.js 24+, Astro 7.1.3,
  React 19.2.7, TypeScript 7.0.2, TypeORM 1.1.0, PostgreSQL 18, Docker Engine
  29+, Docker Compose v5+, Vitest 4.1.10, and ESLint 10.7.0.
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

- Six-digit PIN setup, unlock, lock, and authenticated PIN change flow.
- User creation, user selection or login, and strict data ownership boundaries.
- Vehicle CRUD with name, type, fuel or energy unit, odometer unit, and default
  currency.
- RU-only formatting for dates, numbers, currencies, and default units.
- Category CRUD with icon, color, and category type.
- Expense CRUD for fuel, charging, maintenance, parking, insurance, lease,
  parts, wash, tolls, and custom categories.
- Fuel and charging entries with odometer, volume or energy amount, total cost,
  unit price, and efficiency calculations.
- QR receipt import: scan, decode, preserve or enrich fiscal receipt details,
  show a review screen, then save as an expense.
- Dashboard with totals, monthly trend, category split, distance driven, fuel
  efficiency, energy efficiency, and cost per distance.
- CSV or JSON export for user-owned backup.
- Mobile-first navigation, forms, scanner, dashboard, and settings.

Do not add a personal-income, vehicle-revenue, reimbursement, or delivery
earnings flow without a separate product decision. A fiscal document's
`Income` operation type describes the seller's transaction, not an Auto
Spendings user's income.

Defer these:

- Telegram bot.
- Subscription or payment features.
- iCloud-like cross-device sync.
- Home-screen widgets beyond normal PWA installability.
- Automated fiscal receipt-provider lookup until a provider documents or grants
  a permitted integration path.
- Production hosting beyond the Docker deployment plan.

## Architecture

Start with a single Astro application in the root checkout. Split it only if
the backend grows enough to justify a separate API service.

Frontend layout:

- Use Astro routes in `src/pages/` as thin route entry points.
- Use Feature-Sliced Design inside `src/`, with Astro route-level page slices
  under `src/_pages/` because Astro owns `src/pages/`.
- Use React islands for PIN keypad, QR scanner, forms, charts, sync status, and
  other interactive widgets.
- Design for mobile first: stable 390px layouts, thumb-friendly controls,
  compact data cards, and no desktop-only navigation dependency.
- Use the official Astro React integration.
- Use a hand-written manifest and service worker in `public/` unless
  implementation evidence proves a PWA plugin is simpler.

Backend and persistence:

- Use TypeScript throughout.
- Use TypeORM migrations for PostgreSQL persistence unless implementation
  evidence later proves another local pattern is better.
- Use TypeORM `EntitySchema` targets rather than decorators. Do not add direct
  `reflect-metadata` imports or TypeScript decorator metadata flags.
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
- `sessions`: opaque session-token hash, user link, expiry, and audit data.
- `auth_attempts`: persistent per-user PIN attempt throttle state.
- `vehicles`: vehicle profile, units, currency, archived state.
- `categories`: user-defined expense categories, icon, color, sort order.
- `expenses`: normalized spending record with amount, currency, date, category,
  vehicle, notes, receipt link, and user-owned mutation id.
- `fuel_entries`: fuel or energy details tied to an expense.
- `receipts`: decoded QR payload, provider, fiscal fields, fetch status, raw
  response metadata, and review state.
- `receipt_items`: optional line items imported from a verified receipt source.
- `receipt_providers`: provider key, display name, supported QR fields, enabled
  state, and integration metadata.

## QR And Taxcom Flow

Automated receipt lookup remains the riskiest unknown. The MVP should handle
safe QR decoding and manual review without attempting provider scraping.

Target flow:

1. User opens the scanner React island.
2. Browser camera scans the receipt QR code.
3. Client decodes the QR payload.
4. Server validates the decoded fields and stores a pending `receipts` row.
5. The server preserves the decoded payload for manual review. A future
   provider may enrich it only through a verified, allowed integration path.
6. User reviews merchant, date, total, category, and vehicle. Line items stay
   optional until a verified provider supplies them.
7. User saves the reviewed receipt as an expense.

Rules for the provider spike:

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
- Hash the PIN with a slow password-hashing algorithm and never store the PIN
  in plaintext.
- Because the first release is multi-user, keep a real server-side session
  boundary before exposing personal spending data. The PIN gates access inside
  a user account; it does not replace identity and session management.
- Store receipt images only if required. Prefer storing structured receipt
  fields and user-reviewed data.
- Do not commit database URLs, bot tokens, Obscura credentials, receipt
  samples, database dumps, or private spending data.

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
- `browser`: browser automation checks for scanner, mobile, and PWA flows.
- `verification-quality`: pre-completion verification plan and evidence.

## Acceptance Checks

These checks are future checks. They cannot pass until the AI-generated app
scaffold exists in the root checkout.

Before calling the MVP complete:

- Task 1 prerequisite and local database readiness gate passed before scaffold
  work began.
- `npm run build`
- `npm run test`
- `npm run test:integration`
- `npm run lint`
- `npm run typecheck`
- Migration up/down against PostgreSQL database `poizoncoded_auto`.
- Browser checks for desktop and mobile viewports on localhost, including
  390px mobile width.
- PWA installability and offline behavior check.
- QR import test with synthetic and user-approved sample receipt payloads.
- RU-only locale check: Russian date/number formatting and RUB currency output.
- App-level scan proving no direct `reflect-metadata` import, decorator flags,
  or TypeORM decorators.
- `git diff --check`

Pending external verification: a user-approved real receipt payload and an
automated provider integration must be tested only after the provider explicitly
permits that use.

## Resolved Decisions

- Resolved on 2026-07-19: Obscura is
  `https://github.com/h4ckf0r0day/obscura`, an open-source Rust headless
  browser for AI agents and web scraping.
- Resolved on 2026-07-19: the first release is multi-user with a per-user
  six-digit PIN privacy lock.
- Resolved on 2026-07-19: localhost is the hosting target for the first MVP.
- Resolved on 2026-07-19: receipt lookup should support multiple fiscal receipt
  providers, not only Taxcom.
- Resolved on 2026-07-19: the first release is RU-only for locale and currency.
- Resolved on 2026-07-21: the app is mobile-first.
- Resolved on 2026-07-21: implementation must be AI-driven with no hand-coded
  manual implementation edits in the delivery workflow.
- Resolved on 2026-07-21: the application must be reproducible from the
  committed `plans/` and `tasks/` files only.
- Resolved on 2026-07-21: the README visual is `public/bg.png`.
- Resolved on 2026-07-21: dependency targets were moved to current stable/LTS
  lines, including Node.js 24+, PostgreSQL 18, TypeORM 1.1.0, and current npm
  latest package versions.
- Resolved on 2026-07-21: prerequisites and local database readiness are
  blocking; without Node.js 24+, Docker Compose v5+, Ruflo package access, a
  reachable PostgreSQL 18 server, and `poizoncoded_auto` database, no app
  scaffold, package install, migration, Docker, test, or deploy task may start.
- Verified again on 2026-07-21: Taxcom's public checker accepts FPD, exact
  amount, and optional date. It is a manual verification fallback, not a
  confirmed automated provider.
- Resolved on 2026-07-19: income tracking is not part of the reference product
  or current scope. Define its meaning in a separate product decision before
  adding it.

## Evidence

Local evidence checked on 2026-07-21:

- `README.md`
- `INSTALL.md`
- `public/bg.png`
- `plans/auto-spendings.md`
- `plans/auto-spendings-deploy.md`
- `tasks/`
- `AGENTS.md`
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

External evidence checked on 2026-07-21:

- `https://apps.apple.com/ru/app/codriver-car-expense-tracker/id1565445958`
- `https://receipt.taxcom.ru/`
- `https://taxcom.ru/baza-znaniy/onlaynkassy-i-ofd/stati/ofd-kak-nayti-i-proverit-chek/`
- `https://lk-ofd.taxcom.ru/ApiHelp/spisok_dokumentov_po_smene_print.html`
- `https://lk-ofd.taxcom.ru/ApiHelp/pechat_dokumenta_v_pdf_formate.html`
- `https://github.com/h4ckf0r0day/obscura`
- `https://docs.astro.build/en/guides/integrations-guide/react/`

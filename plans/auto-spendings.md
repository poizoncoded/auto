# Auto Spendings Build Plan

Status: AI-generated mobile-first MVP present; backend persistence and the
daily-use refactor were implemented and verified complete on 2026-07-21.
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

- The root checkout now contains the imported MVP scaffold: `package.json`,
  `package-lock.json`, `astro.config.mjs`, `docker-compose.yml`, `src/`,
  `scripts/`, `tests/`, and PWA assets under `public/`.
- `INSTALL.md` now carries the simple prerequisite guide: install host Node.js
  and Docker, verify Ruflo package access through npm, then run PostgreSQL 18
  through the checked-in Docker Compose service.
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
- Local database readiness: the default local install runs PostgreSQL 18
  through Docker Compose container `auto-spendings-postgres`; Task 1 must prove
  a PostgreSQL 18 server is accepting connections and the `poizoncoded_auto`
  database exists.
- Hosting target: localhost for the first MVP.
- Runtime dependency targets checked on 2026-07-21: Node.js 24+, Astro 7.1.3,
  React 19.2.7, TypeScript 5.9.3, TypeORM 1.1.0, PostgreSQL 18, Docker Engine
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

## Approved Persistence And Daily-Use Refactor

Status: implemented and verified complete on 2026-07-21.

The next refactor must make the application useful for daily entry while
keeping PostgreSQL as the source of truth for all durable user data. It is a
hardening of the existing API and database-backed MVP, not a replacement with a
generic client-state store.

### Persistence Boundary

- Vehicles, categories, expenses, fuel or charging details, receipts, profile
  settings, and any future durable preferences must be saved through typed
  server endpoints into PostgreSQL.
- Every personal-data endpoint must resolve the authenticated user on the
  server and scope reads and writes by that user. Browser-supplied user IDs must
  never define ownership.
- The browser must not keep a second durable copy of server data. `localStorage`
  is allowed only for the device lock marker and the validated per-user queue of
  unsent new expenses.
- The offline expense queue must synchronize through the same idempotent create
  endpoint as an online expense. A queued record becomes durable only after the
  server accepts it.
- Failed non-expense writes stay as in-memory drafts with a visible retry path.
  The UI must not present them as saved.
- Do not add a generic endpoint that stores the entire application state or an
  unvalidated JSON settings blob. New durable settings require a typed contract
  and an explicit migration.

### Request And Data Flow

Use this flow for every persistent mutation:

```text
React form
  -> typed API request
  -> Zod request validation
  -> authenticated user boundary
  -> domain service
  -> TypeORM transaction when multiple rows change
  -> PostgreSQL
  -> canonical saved record in the response
  -> local UI update and bootstrap reconciliation
```

Keep separate resource endpoints for vehicles, categories, expenses, receipts,
and profile settings. Successful create and update responses must return the
canonical saved record. `/api/bootstrap` remains the authenticated
reconciliation snapshot for the current profile.

### Daily Expense Flow

- Unlocking opens the dashboard.
- A fixed mobile add action must be reachable from every workspace and open a
  compact expense editor.
- The primary fields are amount, category, vehicle, and date.
- Date defaults to today. Category and vehicle default from the newest expense
  returned by the backend, so repeated entry does not require a separate client
  preference store.
- Merchant, note, fuel or charging kind, odometer, quantity, and unit price are
  optional details and should not slow down the common entry path.
- A successful save closes the editor, shows clear confirmation, and updates
  the journal and dashboard from canonical backend data.
- Vehicle, category, and receipt forms should open only when requested instead
  of permanently occupying the mobile workspace.
- Empty states must offer the next useful action. Failed requests must preserve
  entered values and offer retry.

### Refactor Boundaries

- Reduce `src/_pages/home/ui/HomePage.tsx` to the application shell for session,
  bootstrap state, navigation, notifications, and the global expense editor.
- Move authentication, bootstrap loading, offline synchronization, and mutation
  state into focused page-model modules with explicit loading, ready, locked,
  and error states.
- Keep dashboard, expenses, receipts, vehicles, and settings UI local to the
  page slice unless a component has multiple real consumers.
- Keep `src/shared/api/` limited to transport, route contracts, and shared API
  record types. Keep business workflows in the owning page or server domain.
- Split `src/server/services/finance.ts` into focused bootstrap, vehicle,
  category, expense, and receipt services while preserving the endpoint
  contracts and ownership checks.
- Keep TypeORM on explicit `EntitySchema` metadata and migrations. Do not add
  decorators, decorator metadata flags, or a direct `reflect-metadata` import.
- Do not add speculative FSD layers or move files only for cosmetic symmetry.

### Failure And Verification Behavior

- Invalid input must produce actionable field-level feedback without clearing
  the form.
- An unauthenticated response returns the user to the unlock flow without
  exposing cached personal data.
- Expense and fuel or charging writes, plus receipt review and expense
  creation, must remain transactional.
- Reloading the browser or restarting Astro must not lose server-saved data.
- One profile must not be able to read, mutate, export, or delete another
  profile's data.
- Browser verification must cover unlock, quick expense creation, editing,
  deletion, receipt review, navigation, and offline queue synchronization at a
  390px mobile viewport.

## QR And Taxcom Flow

Automated receipt lookup remains the riskiest unknown. The MVP should handle
safe QR decoding and manual review without attempting provider scraping.

Target flow:

1. User opens `Добавить чек` and chooses Camera, Photo, or QR string. Camera is
   the first option.
2. Camera starts an in-app `getUserMedia` video scanner on any trusted HTTPS
   origin, including development through `npm run dev:https`. Plain LAN HTTP
   cannot access `getUserMedia`; it must show an HTTPS-required state and, when
   the development tunnel is running, a direct `Открыть HTTPS-камеру` action
   that issues a one-minute, single-use authenticated handoff. The HTTPS
   endpoint consumes that handoff, creates a Secure origin-scoped session, and
   opens the live Camera step directly without putting the long-lived session
   token in the URL. It must not present a file input as a camera. Photo remains
   a separate native media-library input.
3. Client decodes the QR payload with `jsqr` and advances to pending review.
   Photo decoding must cover full screenshots with surrounding text, compact
   codes, rotation, and the ФНС minimum 40% contrast requirement. Tests must
   use an independent QR encoder and assert the parsed fiscal fields, not only
   that an arbitrary string was recovered.
4. Server validates the decoded fields and stores a pending `receipts` row.
5. The server preserves the decoded payload for manual review. A future
   provider may enrich it only through a verified, allowed integration path.
6. User reviews merchant, date, total, category, and vehicle. Line items stay
   optional until a verified provider supplies them.
7. User saves the reviewed receipt as an expense.

Rules for the provider spike:

- Keep camera, photo-library, and manual QR-string sources available. Camera
  means a live video scanner. Plain LAN HTTP must not attempt `getUserMedia` or
  relabel a file input as Camera. The opt-in trusted HTTPS workflow must publish
  its rotating Quick Tunnel URL to a development-only endpoint so the HTTP UI
  can offer a direct handoff for live-camera verification. Preserve the public
  proxy host, reconstruct the effective origin from `x-forwarded-proto`, and
  send bodyless client mutations as explicit JSON so Astro's origin protection
  works behind TLS termination.
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

The root scaffold exists. Run these checks against the current implementation
and rerun them after the approved persistence and daily-use refactor.

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
  390px mobile width, plus a trusted HTTPS check proving the receipt flow calls
  `getUserMedia` and renders the live camera surface.
- Browser check proving the global add action is reachable from every workspace
  and a repeated expense can reuse the latest backend category and vehicle.
- Persistence check proving vehicle, category, expense, receipt-review, and PIN
  writes survive a browser reload and Astro restart.
- Ownership tests for every personal-data read, create, update, delete, and
  export endpoint.
- Storage scan proving durable domain records are not written to browser
  storage; only the local lock marker and unsent expense queue are allowed.
- PWA installability and offline behavior check.
- QR import test with synthetic and user-approved sample receipt payloads.
- Browser `File` upload check using a screenshot-shaped PNG and an exact
  standard fiscal payload round trip.
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
- Resolved on 2026-07-21: PostgreSQL is the source of truth for all durable
  profile data and future durable preferences.
- Resolved on 2026-07-21: browser storage is limited to the device lock marker
  and validated unsent expense queue; it is not a second application database.
- Resolved on 2026-07-21: the daily flow opens on the dashboard and exposes a
  global mobile expense action from every workspace.
- Resolved on 2026-07-21: quick-entry category and vehicle defaults come from
  the newest backend expense rather than a client-only preference.
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

- `npm run test`: 27 test files and 146 tests passed.
- `npm run test:integration`: 7 test files and 19 PostgreSQL integration tests
  passed, including lifecycle persistence across data-source restarts and
  ownership isolation.
- `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`
  passed with no warnings or diagnostics.
- Storage scan found only the guarded browser-storage adapter; the TypeORM
  decorator and metadata scan returned no matches.
- Browser verification at 390x844 covered unlock, global quick entry from all
  workspaces, repeated backend-derived defaults, edit, delete, receipt review,
  reload persistence, and navigation without horizontal overflow.
- Offline LAN verification queued one expense, replayed exactly one successful
  `POST /api/expenses` after reconnect, cleared the queue, and reloaded the
  canonical amount from PostgreSQL.
- Receipt import presented Camera, Photo, and QR string in that order. At a
  390px trusted HTTPS browser viewport, Camera called `getUserMedia` once,
  rendered a live 640x480 video track, and contained no file input. Plain LAN
  HTTP made zero camera calls, showed the HTTPS requirement, discovered the
  current Quick Tunnel, and transferred the unlocked verification profile
  through a one-time `Открыть HTTPS-камеру` action. The HTTPS endpoint returned
  303, set an HttpOnly Secure SameSite=Lax cookie, removed the handoff token from
  the browser URL, and opened Camera directly. The no-mock browser check produced
  a live 640x480 track, created and deleted a PostgreSQL-backed vehicle, and
  logged out successfully. Photo remained the explicit native file input.
- Uploaded-image coverage decoded a standard Russian fiscal payload from a
  514x410 screenshot-shaped image, a compact QR, and a 90-degree rotated QR at
  40% contrast, then asserted the parsed date, amount, FN, FD, FP, and operation
  type. A browser `File` round trip returned the exact source payload.
- Desktop verification at 1280x800 showed no horizontal overflow, visible
  sidebar and header add action, and hidden mobile navigation.

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
- `src/shared/api/auto.ts`
- `src/_pages/home/model/expense-queue.ts`
- `src/_pages/home/ui/HomePage.tsx`
- `src/server/http/schemas.ts`
- `src/server/services/finance.ts`
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

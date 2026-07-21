# Task 6: Dashboard Export PWA

**Source:** `plans/auto-spendings.md` sections "MVP Scope", "Architecture",
and "Acceptance Checks".

**Goal:** Create dashboard metrics, CSV/JSON export, mobile-first workspace
routing, device-local expense queue integration, PWA shell files, and offline
fallback behavior.

**Files:**

- Create: `src/_pages/dashboard/model/metrics.ts`
- Create: `src/server/services/export.ts`
- Create: `src/_pages/home/model/workspace-route.ts`
- Create: `src/_pages/home/model/local-lock.ts`
- Create: `src/pages/index.astro`
- Create: `src/pages/dashboard/index.astro`
- Create: `src/pages/expenses/index.astro`
- Create: `src/pages/receipts/index.astro`
- Create: `src/pages/vehicles/index.astro`
- Create: `src/pages/settings/index.astro`
- Create: `public/manifest.webmanifest`
- Create: `public/service-worker.js`
- Create: `public/offline.html`
- Create: `public/pwa-192.png`
- Create: `public/pwa-512.png`
- Test: `src/_pages/dashboard/model/metrics.test.ts`
- Test: `src/server/services/export.test.ts`
- Test: `src/_pages/home/model/*.test.ts`

**Interfaces:**

- Consumes: Task 4 spending records, Task 5 receipt records, and Task 3 auth
  state.
- Produces: user-visible summary, backup, routing, installability, and offline
  behavior.

## Steps

- [ ] **Step 1: Confirm the root app workspace**

```bash
pwd
```

Expected: `pwd` is `/Users/poizoncc/Work/poizoncoded/auto`.

- [ ] **Step 2: Write dashboard metric tests**

Create tests for totals, monthly trend, category split, distance driven, fuel
efficiency, energy efficiency, and cost per distance.

```bash
npm run test -- src/_pages/dashboard/model/metrics.test.ts
```

Expected before implementation: tests fail because metrics are absent. Expected
after implementation: tests pass.

- [ ] **Step 3: Implement metrics and export services**

Create `metrics.ts` and `export.ts` with user-scoped aggregation and CSV/JSON
backup output.

```bash
npm run test -- src/_pages/dashboard/model/metrics.test.ts src/server/services/export.test.ts
```

Expected: metric and export tests pass with RU/RUB output expectations.

- [ ] **Step 4: Implement workspace routing models**

Create route-state and local-lock models for dashboard, expenses, receipts,
vehicles, and settings.

```bash
npm run test -- src/_pages/home/model/workspace-route.test.ts src/_pages/home/model/local-lock.test.ts
```

Expected: model tests pass and routes remain stable after reload.

- [ ] **Step 5: Create mobile-first routes**

Create Astro routes for `/dashboard`, `/expenses`, `/receipts`, `/vehicles`,
and `/settings`; make `/` redirect to `/dashboard`.

Expected: every route file exists and loads a route-level page slice from
`src/_pages/`.

- [ ] **Step 6: Add PWA shell assets**

Create the manifest, service worker, offline page, and install icons. Cache only
static shell assets and navigation fallback; do not cache authenticated API
responses.

```bash
test -f public/manifest.webmanifest
test -f public/service-worker.js
test -f public/offline.html
test -f public/pwa-192.png
test -f public/pwa-512.png
```

Expected: every PWA asset exists.

- [ ] **Step 7: Verify authenticated API responses are not cached**

```bash
rg -n "api|cache.put|networkFirst|offline.html|navigate" public/service-worker.js
```

Expected: navigation fallback and static offline behavior are visible; API
responses are not cached.

- [ ] **Step 8: Build the production server bundle**

```bash
npm run build
```

Expected: Astro builds the server output under `dist/` successfully.

- [ ] **Step 9: Browser smoke at mobile and desktop widths**

Run the local app:

```bash
npm run dev
```

Open `http://127.0.0.1:4321/dashboard` and verify these screens are reachable
without layout overlap at `390px` mobile width and a desktop width:

- `/dashboard`
- `/expenses`
- `/receipts`
- `/vehicles`
- `/settings`

Expected: root redirects to `/dashboard`, direct routes load, navigation state
matches the active workspace, and text does not overlap controls.

- [ ] **Step 10: Completion gate**

The task is complete when model/export tests pass, PWA assets exist, production
build passes, and the mobile-first browser smoke has been recorded.

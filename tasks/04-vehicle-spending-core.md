# Task 4: Vehicle Spending Core

**Source:** `plans/auto-spendings.md` sections "MVP Scope", "Architecture",
and "Initial database tables".

**Goal:** Create vehicle CRUD, category CRUD, expense CRUD, fuel and charging
records, user ownership checks, idempotent offline submissions, and RU/RUB
defaults.

**Files:**

- Create: `src/server/services/finance.ts`
- Create: `src/server/http/schemas.ts`
- Create: `src/pages/api/vehicles/`
- Create: `src/pages/api/categories/`
- Create: `src/pages/api/expenses/`
- Create: `src/_pages/home/model/expense-queue.ts`
- Create: `src/_pages/home/ui/VehicleWorkspace.tsx`
- Create: `src/_pages/home/ui/ExpenseWorkspace.tsx`
- Create: `src/_pages/home/ui/SettingsWorkspace.tsx`
- Test: `src/server/http/schemas.test.ts`
- Test: `src/_pages/home/model/expense-queue.test.ts`
- Test: `tests/integration/ownership-and-transactions.integration.test.ts`
- Test: `tests/integration/vehicle-energy.integration.test.ts`
- Test: `tests/integration/expense-idempotency.integration.test.ts`

**Interfaces:**

- Consumes: Task 3 `requireUser`, authenticated session context, and user-owned
  database rows.
- Produces: trusted spending records for dashboard, export, receipt review, and
  offline queue behavior.

## Steps

- [ ] **Step 1: Confirm the root app workspace**

```bash
pwd
```

Expected: `pwd` is `/Users/poizoncc/Work/poizoncoded/auto`.

- [ ] **Step 2: Write validation schema tests**

Create tests for bounded vehicle, category, expense, fuel, and charging inputs,
including `maxAmountKopecks`, `clientMutationId`, and RU/RUB defaults.

```bash
npm run test -- src/server/http/schemas.test.ts
```

Expected before implementation: tests fail because schemas are absent. Expected
after implementation: tests pass.

- [ ] **Step 3: Implement HTTP schemas**

Create `src/server/http/schemas.ts` with Zod schemas for vehicle, category,
expense, fuel-entry, and charging-entry create/update payloads.

Expected: all API inputs are bounded before they reach services.

- [ ] **Step 4: Implement finance service**

Create `src/server/services/finance.ts` with user-scoped operations for vehicles,
categories, expenses, fuel entries, charging entries, and receipt-linked expense
creation.

Expected: every query filters by the authenticated `userId`.

- [ ] **Step 5: Add API routes**

Create server endpoints under `src/pages/api/vehicles/`,
`src/pages/api/categories/`, and `src/pages/api/expenses/` using `requireUser`
and the schemas from Step 3.

Expected: route tests or integration coverage prove unauthorized requests cannot
read or mutate another user's data.

- [ ] **Step 6: Add mobile-first spending UI**

Create React workspaces for vehicles, expenses, and settings with thumb-friendly
forms for a 390px viewport. Desktop layout may enhance the same workflow, but
mobile is the primary design target.

Expected: forms stay usable without horizontal scrolling at 390px width.

- [ ] **Step 7: Add device-local offline queue**

Create `src/_pages/home/model/expense-queue.ts` for queued new-expense
submissions with stable `clientMutationId` values.

```bash
npm run test -- src/_pages/home/model/expense-queue.test.ts
```

Expected: queued expenses replay idempotently after reconnect.

- [ ] **Step 8: Run ownership, energy-kind, and idempotency integration coverage**

```bash
npm run test:integration -- tests/integration/ownership-and-transactions.integration.test.ts tests/integration/vehicle-energy.integration.test.ts tests/integration/expense-idempotency.integration.test.ts
```

Expected: all three integration files pass.

- [ ] **Step 9: Verify no personal-income surface exists**

```bash
rg -n "income|revenue|reimbursement|delivery earnings" src
```

Expected: no user-facing or API surface adds personal income, revenue,
reimbursement, or delivery earnings.

- [ ] **Step 10: Completion gate**

The task is complete when schemas, defaults, ownership tests, energy-kind tests,
idempotency tests, mobile form checks, and no-income scope checks all pass.

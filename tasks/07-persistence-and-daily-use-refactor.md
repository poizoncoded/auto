# Task 7: Persistence And Daily-Use Refactor

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` or
> `superpowers:executing-plans`. Apply TDD for every behavior change and keep
> the root checkout as the only product source.

**Source:** `plans/auto-spendings.md` section "Approved Persistence And
Daily-Use Refactor".

**Goal:** Make PostgreSQL the proven source of truth for every durable user
record, split oversized backend and frontend responsibilities, and provide a
fast mobile expense flow available from every workspace.

**Architecture:** Keep the current Astro application and resource endpoints.
Split server finance behavior behind its existing public module, move session
and data orchestration out of the page shell, and add one global compact expense
editor. Browser storage remains limited to the local lock marker and unsent
expense queue.

**Tech Stack:** Astro 7.1.3, React 19.2.7, TypeScript 5.9.3, Zod 4.4.3,
TypeORM 1.1.0, PostgreSQL 18, Vitest 4.1.10, and Lucide React 1.25.0.

## Global Constraints

- Run every command from `/Users/poizoncc/Work/poizoncoded/auto`.
- Preserve every existing endpoint URL and authenticated ownership boundary.
- Keep `src/server/services/finance.ts` as the stable public API while moving
  implementations into focused service modules.
- All durable domain data is PostgreSQL-backed. Do not add client-only record
  stores or a generic JSON state endpoint.
- `localStorage` may contain only the local lock marker and validated unsent
  expense queue.
- Keep new expense replay idempotent through `clientMutationId`.
- Use TypeORM `EntitySchema`; do not add decorators or a direct
  `reflect-metadata` import.
- Design and verify at 390px before desktop enhancement.
- Keep user-facing copy Russian and amounts in RUB.
- Preserve form drafts after failed requests. Never show an unsaved mutation as
  successful.

---

### Task 7.1: Split Finance Services Without Changing Contracts

**Files:**

- Create: `src/server/services/finance-records.ts`
- Create: `src/server/services/bootstrap.ts`
- Create: `src/server/services/vehicles.ts`
- Create: `src/server/services/categories.ts`
- Create: `src/server/services/expenses.ts`
- Create: `src/server/services/receipts.ts`
- Modify: `src/server/services/finance.ts`
- Create: `src/server/services/finance-records.test.ts`
- Test: `tests/integration/ownership-and-transactions.integration.test.ts`
- Test: `tests/integration/vehicle-energy.integration.test.ts`
- Test: `tests/integration/expense-idempotency.integration.test.ts`

**Interfaces:**

- Consumes: existing TypeORM entities and Zod-inferred input types from
  `src/server/http/schemas.ts`.
- Produces: unchanged exports `getBootstrap`, `createVehicle`, `updateVehicle`,
  `deleteVehicle`, `createCategory`, `updateCategory`, `deleteCategory`,
  `createExpense`, `updateExpense`, `deleteExpense`, `createReceipt`, and
  `reviewReceipt` from `src/server/services/finance.ts`.

- [x] **Step 1: Capture the current integration baseline**

```bash
npm run test:integration -- tests/integration/ownership-and-transactions.integration.test.ts tests/integration/vehicle-energy.integration.test.ts tests/integration/expense-idempotency.integration.test.ts
```

Expected: all selected integration tests pass before the mechanical split.

- [x] **Step 2: Add record-mapping unit coverage**

Create focused tests beside `finance-records.ts` proving that null optional
fields, category names, fuel entries, and receipt timestamps map to the existing
API record shapes.

```ts
expect(toExpenseRecord(expense, category, fuelEntry)).toMatchObject({
  categoryName: category.name,
  fuelEntry: { kind: "fuel" },
  vehicleId: expense.vehicleId
});
```

Run:

```bash
npm run test -- src/server/services/finance-records.test.ts
```

Expected before implementation: FAIL because the mapper module does not exist.

- [x] **Step 3: Move implementations into focused modules**

Use these public signatures exactly:

```ts
export function toExpenseRecord(
  expense: Expense,
  category: Category,
  fuelEntry?: FuelEntry | null
): ExpenseRecord;

export async function getBootstrap(
  database: DataSource,
  userId: string
): Promise<BootstrapData>;
```

Each resource module owns only its resource queries and transaction rules.
`receipts.ts` may consume the transaction-level expense creator from
`expenses.ts`; no other cross-resource dependency is allowed.

- [x] **Step 4: Keep the stable finance public API**

Replace `finance.ts` with explicit re-exports:

```ts
export { getBootstrap } from "./bootstrap";
export { createCategory, deleteCategory, updateCategory } from "./categories";
export { createExpense, deleteExpense, updateExpense } from "./expenses";
export { createReceipt, reviewReceipt } from "./receipts";
export { createVehicle, deleteVehicle, updateVehicle } from "./vehicles";
```

- [x] **Step 5: Prove the split preserved behavior**

```bash
npm run test -- src/server/services/finance-records.test.ts
npm run test:integration -- tests/integration/ownership-and-transactions.integration.test.ts tests/integration/vehicle-energy.integration.test.ts tests/integration/expense-idempotency.integration.test.ts
```

Expected: all selected unit and integration tests pass without endpoint changes.

---

### Task 7.2: Return Actionable Validation Errors

**Files:**

- Modify: `src/server/http/error.ts`
- Modify: `src/server/http/response.ts`
- Modify: `src/shared/api/auto.ts`
- Test: `src/server/http/response.test.ts`
- Create: `src/shared/api/auto.test.ts`

**Interfaces:**

- Produces: `AppError.fields?: Record<string, string>` and
  `ApiRequestError.fields: Record<string, string>`.
- Response error shape:

```ts
{
  error: {
    code: string;
    fields?: Record<string, string>;
    message: string;
  };
}
```

- [x] **Step 1: Write failing server response tests**

Assert that invalid expense input returns `400`, `INVALID_INPUT`, and stable
field keys such as `amountKopecks` and `categoryId` without exposing Zod internals.

```bash
npm run test -- src/server/http/response.test.ts
```

Expected before implementation: FAIL because responses contain only one message.

- [x] **Step 2: Implement field extraction and serialization**

Map each Zod issue path to its first message. Keep the existing top-level error
message and include `fields` only when at least one field path exists.

- [x] **Step 3: Write and pass client error tests**

Mock `fetch` with a failing JSON response and assert:

```ts
await expect(requestJson("/api/expenses", { method: "POST" })).rejects.toMatchObject({
  fields: { amountKopecks: "Required" },
  status: 400
});
```

Run:

```bash
npm run test -- src/shared/api/auto.test.ts src/server/http/response.test.ts
```

Expected: both files pass.

---

### Task 7.3: Extract Session And Backend Data Controllers

**Files:**

- Create: `src/_pages/home/model/browser-storage.ts`
- Create: `src/_pages/home/model/use-workspace-session.ts`
- Create: `src/_pages/home/model/use-workspace-data.ts`
- Create: `src/_pages/home/model/workspace-data.ts`
- Modify: `src/_pages/home/ui/HomePage.tsx`
- Test: `src/_pages/home/model/browser-storage.test.ts`
- Test: `src/_pages/home/model/workspace-data.test.ts`

**Interfaces:**

- `getBrowserStorage(): Storage | null` catches denied storage access.
- `latestExpenseDefaults(data: BootstrapData): Pick<ExpenseInput,
  "categoryId" | "vehicleId">` derives defaults only from backend data.
- `useWorkspaceSession()` owns users, active user, lock state, login,
  registration, logout, and explicit initialization status.
- `useWorkspaceData(userId)` owns bootstrap data, canonical resource mutations,
  notices, queue count, and reconnect synchronization.

- [x] **Step 1: Write failing pure-model tests**

Cover denied storage access, no-expense defaults, archived or missing vehicle
fallback, and latest-expense category/vehicle reuse.

```bash
npm run test -- src/_pages/home/model/browser-storage.test.ts src/_pages/home/model/workspace-data.test.ts
```

Expected before implementation: FAIL because the modules do not exist.

- [x] **Step 2: Implement safe storage and backend-derived defaults**

The defaults helper must use `data.expenses[0]`, confirm referenced records
still exist, and omit an archived vehicle.

```ts
export interface ExpenseDefaults {
  categoryId: string;
  vehicleId: string;
}
```

- [x] **Step 3: Extract session state**

Use a discriminated status instead of independent booleans:

```ts
type SessionStatus = "initializing" | "locked" | "ready";
```

Run `/api/auth/me` independently of `/api/bootstrap`; data loading begins only
after an active user exists. A denied `localStorage` read must not strand the
loading screen.

- [x] **Step 4: Extract backend data and queue synchronization**

All online creates and updates consume canonical API records. Update the local
snapshot immediately, then reconcile with `/api/bootstrap`. Keep queue replay
idempotent and discard only records rejected with non-retryable responses.

- [x] **Step 5: Reduce the page shell**

`HomePage.tsx` composes navigation, session/data controllers, workspaces, global
notices, and the global editor. It must not contain request URLs or queue loops.

- [x] **Step 6: Run model and existing queue tests**

```bash
npm run test -- src/_pages/home/model/browser-storage.test.ts src/_pages/home/model/workspace-data.test.ts src/_pages/home/model/expense-queue.test.ts src/_pages/home/model/local-lock.test.ts src/_pages/home/model/workspace-route.test.ts
```

Expected: all selected model tests pass.

---

### Task 7.4: Add Global Quick Expense Entry

**Files:**

- Create: `src/_pages/home/ui/ExpenseEditor.tsx`
- Create: `src/_pages/home/ui/QuickExpenseSheet.tsx`
- Modify: `src/_pages/home/ui/ExpenseWorkspace.tsx`
- Modify: `src/_pages/home/ui/DashboardView.tsx`
- Modify: `src/_pages/home/ui/HomePage.tsx`
- Modify: `src/app/styles/global.css`
- Test: `src/_pages/home/model/workspace-data.test.ts`

**Interfaces:**

- `ExpenseEditor` consumes backend `BootstrapData`, optional `ExpenseRecord`,
  and `onSave(input, expenseId?)`.
- `QuickExpenseSheet` consumes `open`, `data`, `onClose`, and `onSave`.
- Dashboard and expense workspace consume `onAddExpense(): void`.

- [x] **Step 1: Extract the existing editor without changing behavior**

Move draft creation, validation, fuel or charging fields, and save handling from
`ExpenseWorkspace.tsx` into `ExpenseEditor.tsx`. Keep edit behavior covered by
the existing typecheck and browser smoke.

- [x] **Step 2: Implement compact create mode**

Create mode shows amount, category, vehicle, and date first. Use
`latestExpenseDefaults(data)` and `todayLocalDate()`. Place merchant, note, and
fuel or charging fields inside a native `<details>` section labelled
`Дополнительно`.

- [x] **Step 3: Add the accessible sheet**

The sheet uses `role="dialog"`, `aria-modal="true"`, a labelled heading, close
button, backdrop close, Escape handling, and body scroll locking while open.
Failed saves keep the sheet and draft open.

- [x] **Step 4: Add global entry actions**

Add a fixed center action to mobile navigation and an icon-plus-text action in
the desktop header. Both open the same sheet from every workspace. Dashboard
and expense empty states call the same action.

- [x] **Step 5: Verify keyboard and layout stability**

Ensure controls remain at least 44px high, the sheet fits within `100dvh`, its
content scrolls independently, and the mobile navigation does not cover the
save action or browser safe area.

- [x] **Step 6: Run focused checks**

```bash
npm run typecheck
npm run lint
```

Expected: both commands pass with no warnings.

---

### Task 7.5: Make Secondary Workspaces Action-Driven

**Files:**

- Modify: `src/_pages/home/ui/VehicleWorkspace.tsx`
- Modify: `src/_pages/home/ui/ReceiptWorkspace.tsx`
- Modify: `src/_pages/home/ui/SettingsWorkspace.tsx`
- Modify: `src/app/styles/global.css`

**Interfaces:** Existing workspace props and endpoint contracts remain
unchanged.

- [x] **Step 1: Hide creation forms until requested**

Add explicit `Добавить транспорт`, `Добавить чек`, and `Новая категория`
commands. Opening one form must not alter backend data; cancel closes it without
losing existing records.

- [x] **Step 2: Improve empty states**

Each empty state includes one direct next action. Do not add instructional
feature descriptions or desktop-only affordances.

- [x] **Step 3: Keep destructive actions explicit**

Preserve confirmation before delete, keep archive separate from delete, and
show server errors next to the affected records or form.

- [x] **Step 4: Verify responsive CSS**

At 390px, forms use one column, action rows wrap without overlap, record actions
remain reachable, and fixed navigation respects `env(safe-area-inset-bottom)`.

- [x] **Step 5: Run static verification**

```bash
npm run typecheck
npm run lint
git diff --check
```

Expected: all commands exit with status `0`.

---

### Task 7.6: Prove Backend Persistence And Mobile Usability

**Files:**

- Create: `tests/integration/persistence-lifecycle.integration.test.ts`
- Modify: `plans/auto-spendings.md`
- Modify: `tasks/07-persistence-and-daily-use-refactor.md`

**Interfaces:** The integration test uses `createDisposableDatabase()` and the
public exports from `src/server/services/finance.ts`.

- [x] **Step 1: Write persistence lifecycle coverage**

Create two users and prove vehicle, category, expense with fuel details,
receipt review, update, delete, and bootstrap reload behavior. Reinitialize the
data source between write and read phases. Assert that the second user cannot
read or mutate the first user's records.

```bash
npm run test:integration -- tests/integration/persistence-lifecycle.integration.test.ts
```

Expected before the final fixes: FAIL on any persistence or ownership gap.
Expected after fixes: PASS.

- [x] **Step 2: Run the complete automated suite**

```bash
npm run test
npm run test:integration
npm run lint
npm run typecheck
npm run build
```

Expected: all commands pass.

- [x] **Step 3: Run storage and metadata scans**

```bash
rg -n "localStorage|sessionStorage|indexedDB" src
rg -n 'import "reflect-metadata"|experimentalDecorators|emitDecoratorMetadata|@(Entity|Column|Index|Primary|CreateDate|UpdateDate)' package.json tsconfig.json src tests scripts
```

Expected: browser storage references are limited to lock and offline queue
orchestration. The metadata scan has no matches.

- [x] **Step 4: Run mobile browser verification**

Start `npm run dev:lan`, open `/dashboard` at 390px, and verify unlock, global
quick add from every workspace, repeated defaults, edit, delete, receipt review,
navigation, offline queue replay, reload persistence, and no overlap. Repeat a
desktop smoke at 1280px.

- [x] **Step 5: Record completion evidence**

Check each completed box only after its command or behavior passes. Update the
plan status with exact test counts and date; leave any unverified browser or
external-provider item explicitly pending.

### Task 7 Completion Gate

Task 7 is complete only when all six subtasks pass, PostgreSQL-backed records
survive data-source reinitialization, ownership isolation is proven, browser
storage stays within the two allowed purposes, global quick entry works at
390px from every workspace, and the full build/test/lint/typecheck suite passes.

Completion evidence refreshed on 2026-07-21: 146 unit tests and 19 PostgreSQL
integration tests passed; lint, Astro typecheck, production build, whitespace,
storage, and metadata checks passed; 390px mobile, HTTP-to-HTTPS camera handoff,
live camera capture, offline queue replay, reload persistence, and 1280px
desktop browser checks passed.

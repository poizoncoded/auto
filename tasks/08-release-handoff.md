# Task 8: Release Handoff

**Source:** `plans/auto-spendings.md` sections "Acceptance Checks",
"Resolved Decisions", and "Evidence".

**Goal:** Run the final verification suite, reconcile root docs, and prepare a
concise handoff that separates shipped MVP behavior from pending provider work.

**Files:**

- Read: `README.md`
- Read: `plans/auto-spendings.md`
- Read: `plans/auto-spendings-deploy.md`
- Read: `tasks/`
- Modify: docs only when verification results or implementation status change

**Interfaces:**

- Consumes: Tasks 1-7 passing results.
- Produces: final documented evidence for merge, review, deployment, or the next
  provider spike.

## Steps

- [ ] **Step 1: Run full MVP verification**

```bash
npm run build
npm run test
npm run test:integration
npm run lint
npm run typecheck
```

Expected after the root scaffold exists: all commands pass. Record actual test
counts in the handoff.

- [ ] **Step 2: Run workspace whitespace checks**

```bash
git diff --check
```

Expected: command exits with status `0`.

- [ ] **Step 3: Reconcile direct `reflect-metadata` status**

```bash
rg -n 'import "reflect-metadata"|experimentalDecorators|emitDecoratorMetadata|@(Entity|Column|Index|Primary|CreateDate|UpdateDate)|"reflect-metadata": "' package.json tsconfig.json src tests scripts README.md
npm ls reflect-metadata
```

Expected: the `rg` command has no output and exits with status `1`.
`npm ls reflect-metadata` shows `reflect-metadata` only under TypeORM's
dependency tree.

- [ ] **Step 4: Reconcile docs with current results**

If test counts, source-of-truth rule, dependency policy, mobile verification,
provider status, or browser verification status changed, update these files:

```text
README.md
plans/auto-spendings.md
plans/auto-spendings-deploy.md
tasks/
```

Expected: docs use absolute dates and do not claim provider automation, real
receipt verification, production hosting, Telegram, subscriptions, sync, or
widgets are shipped.

- [ ] **Step 5: Scan docs for stale planning and reference claims**

```bash
rg -n "planning[[:space:]]only|Current state: plan[n]ing|Verified on: 2026-07-[1]9|workt[r]ee|\\.workt[r]ees/auto-spendings-m[v]p" README.md plans tasks
```

Expected: no stale planning-only or alternate-checkout reference claims remain.

- [ ] **Step 6: Review dirty state**

```bash
git status --short --branch
```

Expected: all dirty files are intentional and no secrets, receipt samples,
database dumps, or generated personal data are present.

- [ ] **Step 7: Commit checkpoint**

Use a focused docs commit if the task flow is being committed:

```bash
git add README.md plans/auto-spendings.md plans/auto-spendings-deploy.md tasks
git commit -m "docs: define mobile-first ai-driven auto spendings flow"
```

Expected: commit includes only intentional root docs and task-flow changes.

- [ ] **Step 8: Completion gate**

The task flow is complete when all verification commands pass, docs match the
observed state, and the final handoff states the remaining external work:
user-approved real receipt payload testing and provider-permitted automated
receipt lookup.

# Auto Spendings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reproducible Auto Spendings webapp from `plans/` and
`tasks/` through AI-driven development, verify the localhost MVP, then carry the
remaining receipt-provider risk through a permission-safe spike.

**Architecture:** The root checkout is the product source of truth.
Application code should be generated here as a single mobile-first Astro
application with React islands, TypeORM `EntitySchema`, PostgreSQL migrations,
and server-side API routes. `plans/` and `tasks/` are the only product build
inputs; local app snapshots are not reference material.

**Tech Stack:** Node.js 24+, Ruflo through `npx`, Astro 7.1.3, React 19.2.7,
TypeScript 7.0.2, TypeORM 1.1.0, PostgreSQL 18 through Docker, Docker Compose
v5+, Vitest 4.1.10, ESLint 10.7.0, `@zxing/browser` 0.2.1, `mprocs` 0.9.6.

## Global Constraints

- Source spec: `plans/auto-spendings.md`, verified on `2026-07-21`.
- Source tasks: `tasks/`, verified on `2026-07-21`.
- Run all steps from the root checkout.
- Prerequisites are blocking: until they pass, the only allowed work is
  installing or upgrading prerequisites, starting or creating the local
  PostgreSQL database, rerunning the readiness checks, and updating planning
  docs. Do not start Task 2, create app files, install npm packages, run
  migrations, build Docker images, deploy, or execute tests until Task 1 proves
  Node.js 24+, Docker Engine 29+, Docker Compose v5+, Ruflo package access, a
  reachable PostgreSQL 18 server, and the `poizoncoded_auto` database.
- Use Ruflo as the preferred agent harness when its MCP tools are exposed.
  `.codex/config.toml` starts it through `npx -y ruflo@latest mcp start`.
- Build by AI-driven development only: humans provide intent, review, and
  approval; AI agents generate implementation changes and evidence.
- Do not rely on hand-coded manual implementation edits in the delivery flow.
- Do not copy, compare, repair, or derive code from local app snapshots.
- When product behavior is missing from `plans/` or `tasks/`, update the
  relevant plan or task before generating implementation code.
- Keep the first runtime target on localhost.
- Design mobile first, beginning with a stable 390px viewport.
- Use PostgreSQL database name `poizoncoded_auto`; the default local server is
  Docker container `auto-spendings-postgres`.
- Keep RU-only formatting and Russian ruble amounts for the MVP.
- Keep browser code away from direct PostgreSQL connections.
- Keep database changes behind TypeORM migrations with `synchronize: false`.
- Keep TypeORM entities on `EntitySchema` targets; do not reintroduce direct
  `reflect-metadata` imports or TypeScript decorator metadata flags.
- Treat the six-digit PIN as a privacy lock, not full authentication.
- Keep server-side session boundaries on every personal-data endpoint.
- Do not add income, delivery revenue, reimbursement, Telegram, subscription,
  payment, cross-device sync, widget, or production-hosting scope.
- Do not scrape Taxcom or any fiscal provider.
- Add automated receipt lookup only after a provider documents or grants an
  allowed integration path.
- Never commit `.env`, database URLs, bot tokens, Obscura credentials, receipt
  samples, database dumps, private spending data, or generated personal data.
- Use `npm` and `package-lock.json` unless package-manager policy is changed in
  a separate decision.

---

## Task Order

Execute in order. A task is complete only when its completion gate passes.

| Order | Task | Purpose |
| --- | --- | --- |
| 1 | [Workspace Baseline](01-workspace-baseline.md) | Confirm prerequisites, reproducible source inputs, and protected constraints. |
| 2 | [Runtime And Schema](02-runtime-and-schema.md) | Create and verify the local runtime, dependency policy, and TypeORM schema metadata. |
| 3 | [Users And Security](03-users-and-security.md) | Create and verify user registration, PIN handling, sessions, and authorization boundaries. |
| 4 | [Vehicle Spending Core](04-vehicle-spending-core.md) | Create and verify vehicles, categories, expenses, fuel or charging records, and ownership. |
| 5 | [Receipt Import Boundary](05-receipt-import-boundary.md) | Create and verify QR parsing, pending review, and provider-safety limits. |
| 6 | [Dashboard Export PWA](06-dashboard-export-pwa.md) | Create and verify dashboard metrics, exports, routing, offline queue, and PWA shell. |
| 7 | [Release Handoff](07-release-handoff.md) | Run final checks, document evidence, and prepare a clean handoff. |

## Execution Rules

- Check off steps only after running the named command or completing the named
  action.
- Stop immediately if Task 1 prerequisite or local database readiness checks
  fail. Install the missing prerequisite or create the missing database, rerun
  Task 1, and only then continue.
- When a command fails, patch only the files listed in that task unless the
  failure proves the task boundary is wrong.
- Preserve unrelated dirty work.
- Prefer focused commits after each completed task.
- Record any external provider decision with an absolute date and source URL in
  `plans/auto-spendings.md`.

## Completion Gate For The Whole Flow

- All seven task files have every checklist item marked.
- Task 1 prerequisite and local database readiness evidence is recorded before
  any app scaffold files are created.
- Full verification passes from the root checkout after the scaffold exists:

```bash
npm run build
npm run test
npm run test:integration
npm run lint
npm run typecheck
```

- Whitespace checks pass:

```bash
git diff --check
```

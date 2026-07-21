# Task 3: Users And Security

**Source:** `plans/auto-spendings.md` sections "MVP Scope", "Initial database
tables", and "Security Notes".

**Goal:** Create user registration, PIN privacy lock behavior, server-side
sessions, authorization helpers, and persistent auth-attempt throttling.

**Files:**

- Create: `src/server/services/auth.ts`
- Create: `src/server/security/pin.ts`
- Create: `src/server/security/session.ts`
- Create: `src/server/security/session-store.ts`
- Create: `src/server/security/auth-rate-limit.ts`
- Create: `src/server/http/authorization.ts`
- Create: `src/pages/api/auth/`
- Create: `src/_pages/home/model/local-lock.ts`
- Test: `src/server/security/*.test.ts`
- Test: `src/server/http/authorization.test.ts`
- Test: `src/pages/api/auth/auth-endpoints.test.ts`
- Test: `tests/integration/auth-*.integration.test.ts`

**Interfaces:**

- Consumes: Task 2 `AppDataSource`, `databaseEntities`, users, credentials,
  sessions, and auth-attempt tables.
- Produces: `createUser`, `verifyPin`, `createSession`, `requireUser`, and
  authenticated API route boundaries for Tasks 4-6.

## Steps

- [ ] **Step 1: Confirm the root app workspace**

```bash
pwd
```

Expected: `pwd` is `/Users/poizoncc/Work/poizoncoded/auto`.

- [ ] **Step 2: Write PIN hashing tests**

Create focused tests proving PIN hashes are salted, plaintext PINs are never
stored, correct PINs verify, and incorrect PINs fail.

```bash
npm run test -- src/server/security/pin.test.ts
```

Expected before implementation: tests fail because the PIN helper does not
exist. Expected after implementation: tests pass.

- [ ] **Step 3: Implement PIN hashing**

Create `src/server/security/pin.ts` with a slow password-hashing algorithm,
random salt generation, and constant-result verification helpers.

Expected: no plaintext PIN is returned from any helper.

- [ ] **Step 4: Write and implement session-token storage**

Create tests and implementation for random opaque session tokens, SHA-256 token
hash storage, expiry, and session lookup.

```bash
npm run test -- src/server/security/session.test.ts
```

Expected: session tests pass and no raw token is stored server-side.

- [ ] **Step 5: Add persistent auth throttling**

Create `auth-rate-limit.ts` and integration coverage for failed PIN attempts,
cooldown windows, and successful-attempt reset.

```bash
npm run test:integration -- tests/integration/auth-throttle.integration.test.ts
```

Expected: throttling persists through the database, not only process memory.

- [ ] **Step 6: Add auth service and API endpoints**

Create registration, login, logout, current-user, PIN change, and lock/unlock
endpoints under `src/pages/api/auth/`.

Expected: endpoint tests cover success, validation failure, unauthorized access,
and user isolation.

- [ ] **Step 7: Add authorization helper**

Create `src/server/http/authorization.ts` with `requireUser` and route-level
guards for personal data.

```bash
npm run test -- src/server/http/authorization.test.ts src/pages/api/auth/auth-endpoints.test.ts
```

Expected: unauthenticated requests fail before accessing personal data.

- [ ] **Step 8: Verify PINs and sessions do not store plaintext secrets**

```bash
rg -n "scrypt|randomBytes|createHash|tokenHash|credential" src/server/security src/server/services/auth.ts src/server/database/entities.ts
```

Expected: matches show PIN hashing, random session-token creation, SHA-256 token
hashing, and persisted credential/token-hash fields.

- [ ] **Step 9: Verify unauthenticated PIN recovery is absent**

```bash
rg -n "recover|reset.*pin|forgot" src/pages/api src/_pages/home
```

Expected: no unauthenticated PIN recovery endpoint or UI flow is present.

- [ ] **Step 10: Completion gate**

The task is complete when security unit tests pass, auth integration tests pass,
and route scans confirm session boundaries on personal data.

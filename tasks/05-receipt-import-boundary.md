# Task 5: Receipt Import Boundary

**Source:** `plans/auto-spendings.md` sections "Receipt Import", "QR And
Taxcom Flow", "Resolved Decisions", and "Evidence".

**Goal:** Create browser QR parsing, pending receipt storage, manual review,
receipt-to-expense save, and provider-safety constraints.

**Files:**

- Create: `src/shared/lib/receipt.ts`
- Create: `src/server/services/receipt-validation.ts`
- Create: `src/server/providers/receipt-provider.ts`
- Create: `src/pages/api/receipts/`
- Create: `src/_pages/home/ui/ReceiptScanner.tsx`
- Create: `src/_pages/home/ui/ReceiptWorkspace.tsx`
- Test: `src/shared/lib/receipt.test.ts`
- Test: `src/server/services/receipt-validation.test.ts`
- Test: `tests/integration/receipt-review.integration.test.ts`

**Interfaces:**

- Consumes: Task 4 vehicles, categories, expense creation, and user ownership.
- Produces: receipt records that become expenses only after user review.

## Steps

- [ ] **Step 1: Confirm the root app workspace**

```bash
pwd
```

Expected: `pwd` is `/Users/poizoncc/Work/poizoncoded/auto`.

- [ ] **Step 2: Write synthetic QR parser tests**

Create `src/shared/lib/receipt.test.ts` with synthetic fiscal QR payloads only.
Cover date, total amount, fiscal document number, fiscal drive number, fiscal
sign, operation type, and malformed payloads.

```bash
npm run test -- src/shared/lib/receipt.test.ts
```

Expected before implementation: tests fail because the parser is absent.
Expected after implementation: tests pass.

- [ ] **Step 3: Implement receipt QR parsing**

Create `src/shared/lib/receipt.ts` with `parseReceiptQr` and
`ReceiptQrPayload`. Keep parsed data typed and validate required fiscal fields.

Expected: parser accepts known synthetic payloads and rejects malformed input.

- [ ] **Step 4: Add pending receipt validation and storage**

Create `src/server/services/receipt-validation.ts`, provider-neutral receipt
metadata, and API endpoints under `src/pages/api/receipts/` for create, list,
review, and save-as-expense.

```bash
npm run test -- src/server/services/receipt-validation.test.ts
```

Expected: receipts remain pending until reviewed by the user.

- [ ] **Step 5: Add manual provider boundary**

Create `src/server/providers/receipt-provider.ts` with a manual provider
implementation and no network automation.

Expected: provider metadata records Taxcom only as a manual verification
candidate until permission is documented.

- [ ] **Step 6: Add mobile-first scanner and review UI**

Create `ReceiptScanner.tsx` using `@zxing/browser` and `ReceiptWorkspace.tsx`
for review before expense creation. Optimize the scanner and review controls for
phone camera use at 390px width.

Expected: scanner errors are recoverable and receipt data can be reviewed before
creating an expense.

- [ ] **Step 7: Verify prohibited provider automation is absent**

```bash
rg -n "receipt.taxcom|obscura|puppeteer|playwright|captcha|scrape|browserless" src package.json
```

Expected: no automated Taxcom website integration, Obscura, browser
automation, CAPTCHA, scraping, or browserless provider code is present.

- [ ] **Step 8: Record provider evidence before adding automation**

If a fiscal provider integration is added, record these exact fields in
`plans/auto-spendings.md` before code is merged:

```markdown
- Provider:
- Evidence URL:
- Evidence checked on: YYYY-MM-DD
- Allowed use:
- Authentication model:
- Rate limits:
- Test environment:
- Personal data stored:
```

Expected: no provider automation is merged without a dated evidence record.

- [ ] **Step 9: Completion gate**

The task is complete when QR tests pass, receipts stay pending before review,
mobile scanner review is usable, and provider scans show no prohibited
automation.

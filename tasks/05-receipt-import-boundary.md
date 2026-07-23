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
- Create: `src/_pages/home/model/receipt-import-flow.ts`
- Create: `src/_pages/home/model/receipt-image.ts`
- Create: `src/_pages/home/ui/ReceiptImportSheet.tsx`
- Create: `src/_pages/home/ui/ReceiptScanner.tsx`
- Create: `src/_pages/home/ui/ReceiptWorkspace.tsx`
- Test: `src/_pages/home/model/receipt-import-flow.test.ts`
- Test: `src/_pages/home/model/receipt-image.test.ts`
- Test: `src/shared/lib/receipt.test.ts`
- Test: `src/server/services/receipt-validation.test.ts`
- Test: `tests/integration/receipt-review.integration.test.ts`

**Interfaces:**

- Consumes: Task 4 vehicles, categories, expense creation, and user ownership.
- Produces: receipt records that become expenses only after user review.

## Steps

- [x] **Step 1: Confirm the root app workspace**

```bash
pwd
```

Expected: `pwd` is `/Users/poizoncc/Work/poizoncoded/auto`.

- [x] **Step 2: Write synthetic QR parser tests**

Create `src/shared/lib/receipt.test.ts` with synthetic fiscal QR payloads only.
Cover date, total amount, fiscal document number, fiscal drive number, fiscal
sign, operation type, and malformed payloads. Create `receipt-image.test.ts`
with an independently encoded fiscal QR inside a screenshot-shaped image.
Cover a compact code and a rotated code at 40% contrast, then pass the decoded
value through `parseReceiptQr` and assert every fiscal field.

```bash
npm run test -- src/shared/lib/receipt.test.ts
```

Expected before implementation: tests fail because the parser is absent.
Expected after implementation: tests pass.

- [x] **Step 3: Implement receipt QR parsing**

Create `src/shared/lib/receipt.ts` with `parseReceiptQr` and
`ReceiptQrPayload`. Keep parsed data typed and validate required fiscal fields.

Expected: parser accepts known synthetic payloads and rejects malformed input.

- [x] **Step 4: Add pending receipt validation and storage**

Create `src/server/services/receipt-validation.ts`, provider-neutral receipt
metadata, and API endpoints under `src/pages/api/receipts/` for create, list,
review, and save-as-expense.

```bash
npm run test -- src/server/services/receipt-validation.test.ts
```

Expected: receipts remain pending until reviewed by the user.

- [x] **Step 5: Add manual provider boundary**

Create `src/server/providers/receipt-provider.ts` with a manual provider
implementation and no network automation.

Expected: provider metadata records Taxcom only as a manual verification
candidate until permission is documented.

- [x] **Step 6: Add source-first mobile scanner and review UI**

Create `ReceiptImportSheet.tsx` with Camera, Photo, and QR-string sources in
that order. Camera must start a live `getUserMedia` scanner whenever the origin
is trusted HTTPS, including `npm run dev:https`. On plain LAN HTTP, selecting
Camera must show that HTTPS is required and must not relabel a file input as a
camera. When Task 2's development tunnel is active, that state must discover
its validated URL and render `Открыть HTTPS-камеру`. The button must request the
authenticated one-time handoff, navigate to HTTPS, and open Camera directly
after the endpoint establishes the new origin's session. Photo remains a
separate visible native file input. Decode photo and live frames with `jsqr`,
then close the sheet and select the pending receipt in `ReceiptWorkspace.tsx`
for review.

```bash
npm run test -- src/_pages/home/model/receipt-import-flow.test.ts src/_pages/home/model/receipt-image.test.ts src/_pages/home/model/receipt-scanner.test.ts
```

Expected: Camera is the first source, secure development renders a live video
scanner, insecure HTTP explains the HTTPS requirement, Photo emits a native
file chooser, the HTTP development handoff opens the current trusted tunnel,
preserves the unlocked profile, and starts Camera without a second selection.
Screenshot-style uploads round-trip the exact fiscal payload, and scanner errors
remain recoverable without nested forms.

- [x] **Step 7: Verify prohibited provider automation is absent**

```bash
rg -n "receipt.taxcom|obscura|puppeteer|playwright|captcha|scrape|browserless" src package.json
```

Expected: no automated Taxcom website integration, Obscura, browser
automation, CAPTCHA, scraping, or browserless provider code is present.

- [x] **Step 8: Record provider evidence before adding automation**

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
No automated provider is included in this release; the plan records Taxcom as
a manual verification candidate only.

- [x] **Step 9: Completion gate**

The task is complete when QR tests pass, receipts stay pending before review,
mobile scanner review is usable, and provider scans show no prohibited
automation.

Completion evidence recorded on 2026-07-21: the source-first 390px flow kept
Camera, Photo, and QR-string in that order. A trusted HTTPS browser check called
`getUserMedia` once with an environment-facing preference, rendered one live
640x480 video track, and found no file input in Camera. The same check on plain
LAN HTTP made zero camera calls and showed the HTTPS-required state; Photo alone
rendered the native file input. The HTTP state discovered the rotating Quick
Tunnel and exposed `Открыть HTTPS-камеру`; following it preserved `/receipts`
through a single-use authenticated transfer, removed the handoff token, and
opened a secure live 640x480 Camera automatically. A real-backend browser check
also created and deleted a vehicle and logged out through the HTTPS proxy.
Screenshot, compact, rotation, 40% contrast, fiscal parsing, and browser `File`
upload checks all recovered the expected payload. The prohibited-provider scan
returned no matches.

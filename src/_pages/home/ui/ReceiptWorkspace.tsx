import { Check, FileCheck2, LoaderCircle, Plus } from "lucide-react";
import { lazy, Suspense, useCallback, useMemo, useState } from "react";

import type { ReceiptImportSource } from "@/_pages/home/model/receipt-import-flow";
import type { BootstrapData, ExpenseInput, ReceiptRecord } from "@/shared/api/auto";
import {
  formatDate,
  formatRuble,
  kopecksToInput,
  toKopecks,
  todayLocalDate
} from "@/shared/lib/format";

const ReceiptImportSheet = lazy(() => import("./ReceiptImportSheet"));

interface ReceiptWorkspaceProps {
  data: BootstrapData;
  initialImportSource?: ReceiptImportSource | null;
  onCreateReceipt: (rawPayload: string) => Promise<ReceiptRecord>;
  onReviewReceipt: (receiptId: string, input: ExpenseInput) => Promise<void>;
}

interface ReviewDraft {
  amount: string;
  categoryId: string;
  merchant: string;
  note: string;
  occurredOn: string;
  vehicleId: string;
}

function makeReviewDraft(receipt: ReceiptRecord | undefined, defaultCategoryId: string): ReviewDraft {
  return {
    amount: receipt?.totalKopecks ? kopecksToInput(receipt.totalKopecks) : "",
    categoryId: defaultCategoryId,
    merchant: "",
    note: "",
    occurredOn: receipt?.issuedAt?.slice(0, 10) ?? todayLocalDate(),
    vehicleId: ""
  };
}

function ReceiptReviewForm({
  data,
  onComplete,
  onReviewReceipt,
  receipt
}: {
  data: BootstrapData;
  onComplete: () => void;
  onReviewReceipt: (receiptId: string, input: ExpenseInput) => Promise<void>;
  receipt?: ReceiptRecord;
}) {
  const [draft, setDraft] = useState<ReviewDraft>(() => makeReviewDraft(receipt, data.categories[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateDraft<K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(): Promise<void> {
    if (!receipt) {
      return;
    }

    const amountKopecks = toKopecks(draft.amount);

    if (!amountKopecks || !draft.categoryId) {
      setError("Укажите сумму и категорию.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onReviewReceipt(receipt.id, {
        amountKopecks,
        categoryId: draft.categoryId,
        ...(draft.merchant.trim() ? { merchant: draft.merchant.trim() } : {}),
        ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
        occurredOn: draft.occurredOn,
        ...(draft.vehicleId ? { vehicleId: draft.vehicleId } : {})
      });
      onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось проверить чек");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="editor-panel receipt-review" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Подтверждение</span>
          <h2>{receipt ? "Проверить расход" : "Выберите чек"}</h2>
        </div>
        <FileCheck2 size={23} aria-hidden="true" />
      </div>
      {receipt ? (
        <>
          <div className="form-grid">
            <label className="field">
              <span>Сумма, ₽</span>
              <input inputMode="decimal" value={draft.amount} onChange={(event) => updateDraft("amount", event.target.value)} />
            </label>
            <label className="field">
              <span>Дата</span>
              <input type="date" value={draft.occurredOn} onChange={(event) => updateDraft("occurredOn", event.target.value)} />
            </label>
            <label className="field">
              <span>Категория</span>
              <select value={draft.categoryId} onChange={(event) => updateDraft("categoryId", event.target.value)}>
                <option value="">Выберите категорию</option>
                {data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Транспорт</span>
              <select value={draft.vehicleId} onChange={(event) => updateDraft("vehicleId", event.target.value)}>
                <option value="">Без транспорта</option>
                {data.vehicles.filter((vehicle) => !vehicle.archived).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Место</span>
              <input maxLength={140} value={draft.merchant} onChange={(event) => updateDraft("merchant", event.target.value)} />
            </label>
            <label className="field">
              <span>Заметка</span>
              <input maxLength={2000} value={draft.note} onChange={(event) => updateDraft("note", event.target.value)} />
            </label>
          </div>
          {error ? <p className="inline-message error-message" role="alert">{error}</p> : null}
          <button className="primary-button" disabled={saving} type="submit">
            <Check size={18} aria-hidden="true" />
            {saving ? "Сохраняем" : "Сохранить расход"}
          </button>
        </>
      ) : <p className="empty-state">Выберите строку слева.</p>}
    </form>
  );
}

export function ReceiptWorkspace({
  data,
  initialImportSource = null,
  onCreateReceipt,
  onReviewReceipt
}: ReceiptWorkspaceProps) {
  const [importOpen, setImportOpen] = useState(Boolean(initialImportSource));
  const [importSource, setImportSource] = useState<ReceiptImportSource | null>(initialImportSource);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pendingReceipts = useMemo(
    () => data.receipts.filter((receipt) => receipt.status === "pending"),
    [data.receipts]
  );
  const selectedReceipt = pendingReceipts.find((receipt) => receipt.id === selectedReceiptId) ?? pendingReceipts[0];

  const openImporter = useCallback(() => {
    setError(null);
    setImportSource(null);
    setImportOpen(true);
  }, []);

  const closeImporter = useCallback(() => {
    setError(null);
    setImportSource(null);
    setImportOpen(false);
  }, []);

  const submitPayload = useCallback(
    async (payload: string): Promise<boolean> => {
      const value = payload.trim();

      if (!value || saving) {
        return false;
      }

      setSaving(true);
      setError(null);

      try {
        const receipt = await onCreateReceipt(value);
        setSelectedReceiptId(receipt.id);
        setImportOpen(false);
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Не удалось добавить чек");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onCreateReceipt, saving]
  );

  return (
    <div className="workspace receipts-workspace">
      <section className="section-intro">
        <div>
          <span className="eyebrow">Фискальные документы</span>
          <h1>Чеки</h1>
        </div>
        <div className="section-intro-actions">
          <span className="data-count">{data.receipts.length} чеков</span>
          <button className="secondary-button" type="button" onClick={openImporter}>
            <Plus size={17} aria-hidden="true" />
            Добавить чек
          </button>
        </div>
      </section>

      {importOpen ? (
        <Suspense fallback={<p className="inline-message"><LoaderCircle className="spinning" size={17} aria-hidden="true" />Открываем добавление чека</p>}>
          <ReceiptImportSheet
            error={error}
            initialSource={importSource}
            onClose={closeImporter}
            onSubmitPayload={submitPayload}
            saving={saving}
          />
        </Suspense>
      ) : null}

      <section className="receipt-columns">
        <div className="records-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Проверка</span>
              <h2>Ожидают разбора</h2>
            </div>
          </div>
          {pendingReceipts.length ? (
            <ul className="record-list receipt-list">
              {pendingReceipts.map((receipt) => (
                <li className={`receipt-record${selectedReceipt?.id === receipt.id ? " selected" : ""}`} key={receipt.id}>
                  <button type="button" onClick={() => setSelectedReceiptId(receipt.id)}>
                    <span className="record-category">{receipt.issuedAt ? formatDate(receipt.issuedAt.slice(0, 10)) : "Дата не найдена"}</span>
                    <strong>{receipt.totalKopecks ? formatRuble(receipt.totalKopecks) : "Сумма не найдена"}</strong>
                    <span className="record-meta">ФД {receipt.fiscalDocumentNumber ?? "-"} · ФН {receipt.fiscalDriveNumber ?? "-"}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state-with-action">
              <p className="empty-state">Нет чеков для проверки.</p>
              <button className="secondary-button" type="button" onClick={openImporter}>
                <Plus size={17} aria-hidden="true" />
                Добавить чек
              </button>
            </div>
          )}
        </div>

        {selectedReceipt ? (
          <ReceiptReviewForm
            data={data}
            key={selectedReceipt.id}
            onComplete={() => setSelectedReceiptId(null)}
            onReviewReceipt={onReviewReceipt}
            receipt={selectedReceipt}
          />
        ) : null}
      </section>

      {data.receipts.some((receipt) => receipt.status === "reviewed") ? (
        <section className="records-section reviewed-receipts">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Готово</span>
              <h2>Проверенные чеки</h2>
            </div>
          </div>
          <ul className="compact-records">
            {data.receipts.filter((receipt) => receipt.status === "reviewed").map((receipt) => (
              <li key={receipt.id}>
                <Check size={16} aria-hidden="true" />
                <span>{receipt.issuedAt ? formatDate(receipt.issuedAt.slice(0, 10)) : "Чек"}</span>
                <strong>{receipt.totalKopecks ? formatRuble(receipt.totalKopecks) : ""}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

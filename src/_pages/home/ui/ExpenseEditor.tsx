import { Fuel, Plus, X, Zap } from "lucide-react";
import { useState } from "react";

import { latestExpenseDefaults, type ExpenseDefaults } from "@/_pages/home/model/workspace-data";
import {
  ApiRequestError,
  type BootstrapData,
  type ExpenseInput,
  type ExpenseRecord,
  type FuelEntryKind
} from "@/shared/api/auto";
import { kopecksToInput, toKopecks, todayLocalDate } from "@/shared/lib/format";

interface ExpenseEditorProps {
  compact?: boolean;
  data: BootstrapData;
  expense?: ExpenseRecord;
  onCancel: () => void;
  onSave: (input: ExpenseInput, expenseId?: string) => Promise<void>;
  onSaved?: () => void;
}

type EntryKind = FuelEntryKind | "none";

interface ExpenseDraft {
  amount: string;
  categoryId: string;
  entryKind: EntryKind;
  merchant: string;
  note: string;
  occurredOn: string;
  odometerKm: string;
  quantity: string;
  unitPrice: string;
  vehicleId: string;
}

function decimalInput(value: number): string {
  return String(value).replace(".", ",");
}

function makeDraft(expense: ExpenseRecord | undefined, defaults: ExpenseDefaults): ExpenseDraft {
  return {
    amount: expense ? kopecksToInput(expense.amountKopecks) : "",
    categoryId: expense?.categoryId ?? defaults.categoryId,
    entryKind: expense?.fuelEntry?.kind ?? "none",
    merchant: expense?.merchant ?? "",
    note: expense?.note ?? "",
    occurredOn: expense?.occurredOn ?? todayLocalDate(),
    odometerKm: expense?.fuelEntry ? String(expense.fuelEntry.odometerKm) : "",
    quantity: expense?.fuelEntry ? decimalInput(expense.fuelEntry.quantityMilliUnits / 1000) : "",
    unitPrice: expense?.fuelEntry?.unitPriceKopecks
      ? kopecksToInput(expense.fuelEntry.unitPriceKopecks)
      : "",
    vehicleId: expense?.vehicleId ?? defaults.vehicleId
  };
}

function parseQuantity(value: string): number | null {
  const parsed = Number(value.trim().replace(",", "."));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 1000);
}

function buildExpenseInput(
  draft: ExpenseDraft,
  { clearFuelEntry, clearVehicle }: { clearFuelEntry: boolean; clearVehicle: boolean }
): ExpenseInput | null {
  const amountKopecks = toKopecks(draft.amount);

  if (!amountKopecks || !draft.categoryId) {
    return null;
  }

  const input: ExpenseInput = {
    amountKopecks,
    categoryId: draft.categoryId,
    ...(draft.merchant.trim() ? { merchant: draft.merchant.trim() } : {}),
    ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    occurredOn: draft.occurredOn,
    ...(draft.vehicleId ? { vehicleId: draft.vehicleId } : clearVehicle ? { vehicleId: null } : {})
  };

  if (draft.entryKind === "none") {
    return { ...input, ...(clearFuelEntry ? { fuelEntry: null } : {}) };
  }

  const odometerKm = Number(draft.odometerKm);
  const quantityMilliUnits = parseQuantity(draft.quantity);
  const unitPriceKopecks = draft.unitPrice.trim()
    ? (toKopecks(draft.unitPrice) ?? undefined)
    : undefined;

  if (
    !Number.isInteger(odometerKm) ||
    odometerKm < 0 ||
    !quantityMilliUnits ||
    (draft.unitPrice.trim() && !unitPriceKopecks)
  ) {
    return null;
  }

  return {
    ...input,
    fuelEntry: {
      kind: draft.entryKind,
      odometerKm,
      quantityMilliUnits,
      ...(unitPriceKopecks === undefined ? {} : { unitPriceKopecks })
    }
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null;
}

export function ExpenseEditor({
  compact = false,
  data,
  expense,
  onCancel,
  onSave,
  onSaved
}: ExpenseEditorProps) {
  const defaults = latestExpenseDefaults(data);
  const [draft, setDraft] = useState<ExpenseDraft>(() => makeDraft(expense, defaults));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const activeVehicles = data.vehicles.filter((vehicle) => !vehicle.archived);

  function updateDraft<K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]): void {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors({});
  }

  async function submit(): Promise<void> {
    const input = buildExpenseInput(draft, {
      clearFuelEntry: Boolean(expense?.fuelEntry),
      clearVehicle: Boolean(expense?.vehicleId)
    });

    if (!input) {
      setError("Проверьте сумму, категорию и параметры топлива или зарядки.");
      setFieldErrors({
        ...(!toKopecks(draft.amount) ? { amountKopecks: "Введите сумму больше нуля" } : {}),
        ...(!draft.categoryId ? { categoryId: "Выберите категорию" } : {})
      });
      return;
    }

    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      await onSave(input, expense?.id);
      if (expense) {
        onCancel();
      } else if (onSaved) {
        onSaved();
      } else {
        setDraft(makeDraft(undefined, defaults));
      }
    } catch (caught) {
      if (caught instanceof ApiRequestError) {
        setFieldErrors(caught.fields);
      }
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить расход");
    } finally {
      setSaving(false);
    }
  }

  const additionalFields = (
    <div className="expense-additional-fields">
      <div className="form-grid additional-expense-grid">
        <label className="field">
          <span>Место</span>
          <input
            maxLength={140}
            placeholder="АЗС, сервис, парковка"
            value={draft.merchant}
            onChange={(event) => updateDraft("merchant", event.target.value)}
          />
          <FieldError message={fieldErrors.merchant} />
        </label>
        <label className="field">
          <span>Заметка</span>
          <textarea
            maxLength={2000}
            placeholder="Необязательно"
            rows={3}
            value={draft.note}
            onChange={(event) => updateDraft("note", event.target.value)}
          />
          <FieldError message={fieldErrors.note} />
        </label>
      </div>

      <div className="entry-kind" aria-label="Тип дополнительной записи">
        <span className="field-label">Данные о поездке</span>
        <div className="segmented-control">
          <button
            className={draft.entryKind === "none" ? "active" : ""}
            type="button"
            onClick={() => updateDraft("entryKind", "none")}
          >
            Нет
          </button>
          <button
            className={draft.entryKind === "fuel" ? "active" : ""}
            type="button"
            onClick={() => updateDraft("entryKind", "fuel")}
          >
            <Fuel size={15} aria-hidden="true" />
            Топливо
          </button>
          <button
            className={draft.entryKind === "charging" ? "active" : ""}
            type="button"
            onClick={() => updateDraft("entryKind", "charging")}
          >
            <Zap size={15} aria-hidden="true" />
            Зарядка
          </button>
        </div>
      </div>

      {draft.entryKind !== "none" ? (
        <div className="form-grid fuel-grid">
          <label className="field">
            <span>Одометр, км</span>
            <input
              inputMode="numeric"
              min="0"
              placeholder="0"
              value={draft.odometerKm}
              onChange={(event) => updateDraft("odometerKm", event.target.value)}
            />
            <FieldError message={fieldErrors["fuelEntry.odometerKm"]} />
          </label>
          <label className="field">
            <span>{draft.entryKind === "fuel" ? "Объём, л" : "Энергия, кВт⋅ч"}</span>
            <input
              inputMode="decimal"
              placeholder="0,000"
              value={draft.quantity}
              onChange={(event) => updateDraft("quantity", event.target.value)}
            />
            <FieldError message={fieldErrors["fuelEntry.quantityMilliUnits"]} />
          </label>
          <label className="field">
            <span>Цена за единицу, ₽</span>
            <input
              inputMode="decimal"
              placeholder="Необязательно"
              value={draft.unitPrice}
              onChange={(event) => updateDraft("unitPrice", event.target.value)}
            />
            <FieldError message={fieldErrors["fuelEntry.unitPriceKopecks"]} />
          </label>
        </div>
      ) : null}
    </div>
  );

  return (
    <form
      className={compact ? "expense-editor compact-expense-editor" : "editor-panel expense-editor"}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {!compact ? (
        <div className="section-heading">
          <div>
            <span className="eyebrow">{expense ? "Редактирование" : "Новая запись"}</span>
            <h2>{expense ? "Изменить расход" : "Добавить расход"}</h2>
          </div>
          {expense ? (
            <button
              className="icon-button"
              type="button"
              aria-label="Отменить редактирование"
              title="Отменить"
              onClick={onCancel}
            >
              <X size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="form-grid expense-grid expense-primary-fields">
        <label className="field amount-field">
          <span>Сумма, ₽</span>
          <input
            aria-invalid={Boolean(fieldErrors.amountKopecks)}
            autoFocus={compact}
            inputMode="decimal"
            placeholder="0,00"
            value={draft.amount}
            onChange={(event) => updateDraft("amount", event.target.value)}
          />
          <FieldError message={fieldErrors.amountKopecks} />
        </label>
        <label className="field">
          <span>Категория</span>
          <select
            aria-invalid={Boolean(fieldErrors.categoryId)}
            value={draft.categoryId}
            onChange={(event) => updateDraft("categoryId", event.target.value)}
          >
            <option value="">Выберите категорию</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.categoryId} />
        </label>
        <label className="field">
          <span>Транспорт</span>
          <select
            aria-invalid={Boolean(fieldErrors.vehicleId)}
            value={draft.vehicleId}
            onChange={(event) => updateDraft("vehicleId", event.target.value)}
          >
            <option value="">Без транспорта</option>
            {activeVehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </option>
            ))}
          </select>
          <FieldError message={fieldErrors.vehicleId} />
        </label>
        <label className="field">
          <span>Дата</span>
          <input
            aria-invalid={Boolean(fieldErrors.occurredOn)}
            type="date"
            value={draft.occurredOn}
            onChange={(event) => updateDraft("occurredOn", event.target.value)}
          />
          <FieldError message={fieldErrors.occurredOn} />
        </label>
      </div>

      {compact ? (
        <details className="expense-details">
          <summary>Дополнительно</summary>
          {additionalFields}
        </details>
      ) : (
        additionalFields
      )}

      {error ? (
        <p className="inline-message error-message" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button className="primary-button" disabled={saving || !data.categories.length} type="submit">
          <Plus size={18} aria-hidden="true" />
          {saving ? "Сохраняем" : expense ? "Сохранить" : "Добавить"}
        </button>
      </div>
    </form>
  );
}

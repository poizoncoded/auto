import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import type { BootstrapData, ExpenseInput, ExpenseRecord } from "@/shared/api/auto";
import { formatDate, formatQuantity, formatRuble } from "@/shared/lib/format";

import { ExpenseEditor } from "./ExpenseEditor";

interface ExpenseWorkspaceProps {
  data: BootstrapData;
  onAddExpense: () => void;
  onDelete: (expenseId: string) => Promise<void>;
  onSave: (input: ExpenseInput, expenseId?: string) => Promise<void>;
}

export function ExpenseWorkspace({ data, onAddExpense, onDelete, onSave }: ExpenseWorkspaceProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editingExpense = data.expenses.find((expense) => expense.id === editingId);

  async function removeExpense(expense: ExpenseRecord): Promise<void> {
    if (!window.confirm(`Удалить расход ${formatRuble(expense.amountKopecks)}?`)) {
      return;
    }

    try {
      await onDelete(expense.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось удалить расход");
    }
  }

  return (
    <div className="workspace expenses-workspace">
      <section className="section-intro">
        <div>
          <span className="eyebrow">Журнал</span>
          <h1>Расходы</h1>
        </div>
        <div className="section-intro-actions">
          <span className="data-count">{data.expenses.length} записей</span>
          <button className="secondary-button" type="button" onClick={onAddExpense}>
            <Plus size={17} aria-hidden="true" />
            Добавить расход
          </button>
        </div>
      </section>

      {editingExpense ? (
        <ExpenseEditor
          data={data}
          expense={editingExpense}
          key={editingExpense.id}
          onCancel={() => setEditingId(null)}
          onSave={onSave}
        />
      ) : null}

      {error ? (
        <p className="inline-message error-message" role="alert">
          {error}
        </p>
      ) : null}

      <section className="records-section" aria-label="Список расходов">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Последние</span>
            <h2>Журнал расходов</h2>
          </div>
        </div>
        {data.expenses.length ? (
          <ul className="record-list">
            {data.expenses.map((expense) => {
              const vehicle = data.vehicles.find((item) => item.id === expense.vehicleId);
              const entryUnit = expense.fuelEntry?.kind === "charging" ? "kWh" : "l";
              return (
                <li className="expense-record" key={expense.id}>
                  <div className="record-main">
                    <span className="record-category">{expense.categoryName}</span>
                    <strong>{expense.merchant || expense.note || "Без названия"}</strong>
                    <span className="record-meta">
                      {formatDate(expense.occurredOn)}
                      {vehicle ? ` · ${vehicle.name}` : ""}
                      {expense.fuelEntry
                        ? ` · ${formatQuantity(expense.fuelEntry.quantityMilliUnits, entryUnit)}`
                        : ""}
                    </span>
                  </div>
                  <strong className="record-amount">{formatRuble(expense.amountKopecks)}</strong>
                  <div className="record-actions">
                    <button
                      className="icon-button"
                      type="button"
                      aria-label="Редактировать расход"
                      title="Редактировать"
                      onClick={() => setEditingId(expense.id)}
                    >
                      <Pencil size={17} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label="Удалить расход"
                      title="Удалить"
                      onClick={() => void removeExpense(expense)}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state-with-action">
            <p className="empty-state">Журнал пока пуст.</p>
            <button className="secondary-button" type="button" onClick={onAddExpense}>
              <Plus size={17} aria-hidden="true" />
              Добавить первый расход
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

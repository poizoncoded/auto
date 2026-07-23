import { X } from "lucide-react";
import { useEffect } from "react";

import type { BootstrapData, ExpenseInput } from "@/shared/api/auto";

import { ExpenseEditor } from "./ExpenseEditor";

interface QuickExpenseSheetProps {
  data: BootstrapData;
  onClose: () => void;
  onSave: (input: ExpenseInput, expenseId?: string) => Promise<void>;
  open: boolean;
}

export function QuickExpenseSheet({ data, onClose, onSave, open }: QuickExpenseSheetProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="quick-expense-title"
        aria-modal="true"
        className="quick-expense-sheet"
        role="dialog"
      >
        <header className="sheet-header">
          <div>
            <span className="eyebrow">Новая запись</span>
            <h2 id="quick-expense-title">Добавить расход</h2>
          </div>
          <button
            aria-label="Закрыть"
            className="icon-button"
            onClick={onClose}
            title="Закрыть"
            type="button"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <ExpenseEditor
          compact
          data={data}
          onCancel={onClose}
          onSave={onSave}
          onSaved={onClose}
        />
      </section>
    </div>
  );
}

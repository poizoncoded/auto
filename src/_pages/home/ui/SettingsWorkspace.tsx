import { CircleDot, Download, KeyRound, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import type { BootstrapData, CategoryInput, CategoryRecord } from "@/shared/api/auto";

interface SettingsWorkspaceProps {
  data: BootstrapData;
  onChangePin: (currentPin: string, nextPin: string) => Promise<void>;
  onCreateCategory: (input: CategoryInput) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onUpdateCategory: (categoryId: string, input: Partial<CategoryInput>) => Promise<void>;
}

const iconOptions = ["CircleDollarSign", "Fuel", "Zap", "Wrench", "ParkingCircle", "ShieldCheck", "Car", "Package", "Sparkles", "Milestone"];

function emptyCategory(): CategoryInput {
  return { color: "#147D64", icon: "CircleDollarSign", name: "" };
}

function CategoryForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel
}: {
  initial: CategoryInput;
  onCancel?: () => void;
  onSubmit: (input: CategoryInput) => Promise<void>;
  submitLabel: string;
}) {
  const [draft, setDraft] = useState<CategoryInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (!draft.name.trim()) {
      setError("Укажите название категории.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSubmit({ ...draft, name: draft.name.trim() });
      if (onCancel) {
        onCancel();
      } else {
        setDraft(emptyCategory());
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить категорию");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="category-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <div className="form-grid category-form-grid">
        <label className="field">
          <span>Название</span>
          <input maxLength={60} placeholder="Например, Шины" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label className="field color-field">
          <span>Цвет</span>
          <input type="color" value={draft.color} aria-label="Цвет категории" onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} />
        </label>
        <label className="field">
          <span>Значок</span>
          <select value={draft.icon} onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}>
            {iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
          </select>
        </label>
      </div>
      {error ? <p className="inline-message error-message" role="alert">{error}</p> : null}
      <div className="form-actions">
        <button className="primary-button" disabled={saving} type="submit"><Plus size={18} aria-hidden="true" />{saving ? "Сохраняем" : submitLabel}</button>
      </div>
    </form>
  );
}

function PinForm({ onChangePin }: { onChangePin: (currentPin: string, nextPin: string) => Promise<void> }) {
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(): Promise<void> {
    if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(nextPin)) {
      setMessage("PIN должен содержать шесть цифр.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await onChangePin(currentPin, nextPin);
      setCurrentPin("");
      setNextPin("");
      setMessage("PIN обновлён.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Не удалось изменить PIN");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="pin-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <div className="form-grid">
        <label className="field">
          <span>Текущий PIN</span>
          <input autoComplete="current-password" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" type="password" value={currentPin} onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="field">
          <span>Новый PIN</span>
          <input autoComplete="new-password" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" type="password" value={nextPin} onChange={(event) => setNextPin(event.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      {message ? <p className="inline-message" role="status">{message}</p> : null}
      <button className="primary-button" disabled={saving} type="submit"><KeyRound size={18} aria-hidden="true" />{saving ? "Сохраняем" : "Изменить PIN"}</button>
    </form>
  );
}

export function SettingsWorkspace({ data, onChangePin, onCreateCategory, onDeleteCategory, onUpdateCategory }: SettingsWorkspaceProps) {
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordErrors, setRecordErrors] = useState<Record<string, string>>({});

  async function removeCategory(category: CategoryRecord): Promise<void> {
    if (!window.confirm(`Удалить категорию «${category.name}»?`)) {
      return;
    }

    try {
      await onDeleteCategory(category.id);
      setRecordErrors((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
    } catch (caught) {
      setRecordErrors((current) => ({
        ...current,
        [category.id]: caught instanceof Error ? caught.message : "Не удалось удалить категорию"
      }));
    }
  }

  return (
    <div className="workspace settings-workspace">
      <section className="section-intro">
        <div>
          <span className="eyebrow">Профиль</span>
          <h1>Настройки</h1>
        </div>
      </section>

      <section className="settings-grid">
        <article className="editor-panel pin-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Доступ</span>
              <h2>Изменить PIN</h2>
            </div>
            <KeyRound size={23} aria-hidden="true" />
          </div>
          <PinForm onChangePin={onChangePin} />
        </article>
        <article className="editor-panel export-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Резервная копия</span>
              <h2>Экспорт</h2>
            </div>
            <Download size={23} aria-hidden="true" />
          </div>
          <div className="export-actions">
            <a className="secondary-button" href="/api/export.csv"><Download size={17} aria-hidden="true" />CSV</a>
            <a className="secondary-button" href="/api/export.json"><Download size={17} aria-hidden="true" />JSON</a>
          </div>
        </article>
      </section>

      {creatingCategory ? (
        <section className="editor-panel category-create-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Категории</span>
              <h2>Новая категория</h2>
            </div>
            <button className="icon-button" type="button" aria-label="Закрыть форму" title="Закрыть" onClick={() => setCreatingCategory(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <CategoryForm key="new-category" initial={emptyCategory()} onCancel={() => setCreatingCategory(false)} onSubmit={onCreateCategory} submitLabel="Добавить" />
        </section>
      ) : null}

      <section className="records-section" aria-label="Категории расходов">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Список</span>
            <h2>Категории расходов</h2>
          </div>
          <button className="secondary-button" type="button" onClick={() => setCreatingCategory(true)}>
            <Plus size={17} aria-hidden="true" />
            Новая категория
          </button>
        </div>
        {data.categories.length ? (
          <ul className="category-list">
            {data.categories.map((category) => (
            <li className="category-record" key={category.id}>
              <div className="category-summary">
                <span className="category-swatch" style={{ backgroundColor: category.color }}><CircleDot size={16} aria-hidden="true" /></span>
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.icon}</span>
                </div>
              </div>
              <div className="record-actions">
                <button className="icon-button" type="button" aria-label="Редактировать категорию" title="Редактировать" onClick={() => setEditingId(category.id)}><Pencil size={17} aria-hidden="true" /></button>
                <button className="icon-button danger" type="button" aria-label="Удалить категорию" title="Удалить" onClick={() => void removeCategory(category)}><Trash2 size={17} aria-hidden="true" /></button>
              </div>
              {editingId === category.id ? (
                <div className="category-edit">
                  <div className="section-heading compact-heading">
                    <h3>Изменить категорию</h3>
                    <button className="icon-button" type="button" aria-label="Закрыть редактирование" title="Закрыть" onClick={() => setEditingId(null)}><X size={17} aria-hidden="true" /></button>
                  </div>
                  <CategoryForm key={category.id} initial={{ color: category.color, icon: category.icon, name: category.name, sortOrder: category.sortOrder }} onCancel={() => setEditingId(null)} onSubmit={(input) => onUpdateCategory(category.id, input)} submitLabel="Сохранить" />
                </div>
              ) : null}
              {recordErrors[category.id] ? <p className="record-inline-error" role="alert">{recordErrors[category.id]}</p> : null}
            </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state-with-action">
            <p className="empty-state">Категорий пока нет.</p>
            <button className="secondary-button" type="button" onClick={() => setCreatingCategory(true)}>
              <Plus size={17} aria-hidden="true" />
              Новая категория
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

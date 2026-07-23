import { Archive, ArchiveRestore, CarFront, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import type { BootstrapData, VehicleInput, VehicleRecord } from "@/shared/api/auto";

interface VehicleWorkspaceProps {
  data: BootstrapData;
  onCreate: (input: VehicleInput) => Promise<void>;
  onDelete: (vehicleId: string) => Promise<void>;
  onUpdate: (vehicleId: string, input: Partial<VehicleInput> & { archived?: boolean }) => Promise<void>;
}

const vehicleTypes = ["Автомобиль", "Велосипед", "Грузовик", "Мотоцикл", "Самокат", "Другое"];

function emptyVehicle(): VehicleInput {
  return { energyUnit: "l", name: "", type: "Автомобиль" };
}

function VehicleForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel
}: {
  initial: VehicleInput;
  onCancel?: () => void;
  onSubmit: (input: VehicleInput) => Promise<void>;
  submitLabel: string;
}) {
  const [draft, setDraft] = useState<VehicleInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    if (!draft.name.trim()) {
      setError("Укажите название транспорта.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSubmit({ ...draft, name: draft.name.trim() });
      if (onCancel) {
        onCancel();
      } else {
        setDraft(emptyVehicle());
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить транспорт");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="vehicle-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <div className="form-grid vehicle-form-grid">
        <label className="field">
          <span>Название</span>
          <input maxLength={80} placeholder="Например, Octavia" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label className="field">
          <span>Тип</span>
          <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
            {vehicleTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>
      <div className="entry-kind">
        <span className="field-label">Единица энергии</span>
        <div className="segmented-control">
          <button className={draft.energyUnit === "l" ? "active" : ""} type="button" onClick={() => setDraft((current) => ({ ...current, energyUnit: "l" }))}>Литры</button>
          <button className={draft.energyUnit === "kWh" ? "active" : ""} type="button" onClick={() => setDraft((current) => ({ ...current, energyUnit: "kWh" }))}>кВт⋅ч</button>
        </div>
      </div>
      {error ? <p className="inline-message error-message" role="alert">{error}</p> : null}
      <div className="form-actions">
        <button className="primary-button" disabled={saving} type="submit"><Plus size={18} aria-hidden="true" />{saving ? "Сохраняем" : submitLabel}</button>
      </div>
    </form>
  );
}

export function VehicleWorkspace({ data, onCreate, onDelete, onUpdate }: VehicleWorkspaceProps) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordErrors, setRecordErrors] = useState<Record<string, string>>({});

  async function removeVehicle(vehicle: VehicleRecord): Promise<void> {
    if (!window.confirm(`Удалить транспорт «${vehicle.name}»?`)) {
      return;
    }

    try {
      await onDelete(vehicle.id);
      setRecordErrors((current) => {
        const next = { ...current };
        delete next[vehicle.id];
        return next;
      });
    } catch (caught) {
      setRecordErrors((current) => ({
        ...current,
        [vehicle.id]: caught instanceof Error ? caught.message : "Не удалось удалить транспорт"
      }));
    }
  }

  async function toggleArchive(vehicle: VehicleRecord): Promise<void> {
    try {
      await onUpdate(vehicle.id, { archived: !vehicle.archived });
      setRecordErrors((current) => {
        const next = { ...current };
        delete next[vehicle.id];
        return next;
      });
    } catch (caught) {
      setRecordErrors((current) => ({
        ...current,
        [vehicle.id]: caught instanceof Error ? caught.message : "Не удалось изменить транспорт"
      }));
    }
  }

  return (
    <div className="workspace vehicles-workspace">
      <section className="section-intro">
        <div>
          <span className="eyebrow">Профили</span>
          <h1>Транспорт</h1>
        </div>
        <div className="section-intro-actions">
          <span className="data-count">{data.vehicles.length} профилей</span>
          <button className="secondary-button" type="button" onClick={() => setCreating(true)}>
            <Plus size={17} aria-hidden="true" />
            Добавить транспорт
          </button>
        </div>
      </section>

      {creating ? (
        <section className="editor-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Новый профиль</span>
              <h2>Добавить транспорт</h2>
            </div>
            <button className="icon-button" type="button" aria-label="Закрыть форму" title="Закрыть" onClick={() => setCreating(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <VehicleForm key="new-vehicle" initial={emptyVehicle()} onCancel={() => setCreating(false)} onSubmit={onCreate} submitLabel="Добавить" />
        </section>
      ) : null}

      <section className="records-section" aria-label="Транспорт">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Все профили</span>
            <h2>Мой транспорт</h2>
          </div>
        </div>
        {data.vehicles.length ? (
          <ul className="vehicle-list">
            {data.vehicles.map((vehicle) => (
              <li className={`vehicle-record${vehicle.archived ? " archived" : ""}`} key={vehicle.id}>
                <div className="vehicle-summary">
                  <span className="vehicle-icon"><CarFront size={21} aria-hidden="true" /></span>
                  <div>
                    <strong>{vehicle.name}</strong>
                    <span>{vehicle.type} · {vehicle.energyUnit === "l" ? "литры" : "кВт⋅ч"}{vehicle.archived ? " · В архиве" : ""}</span>
                  </div>
                </div>
                <div className="record-actions">
                  <button className="icon-button" type="button" aria-label={vehicle.archived ? "Вернуть из архива" : "Архивировать"} title={vehicle.archived ? "Вернуть из архива" : "Архивировать"} onClick={() => void toggleArchive(vehicle)}>
                    {vehicle.archived ? <ArchiveRestore size={17} aria-hidden="true" /> : <Archive size={17} aria-hidden="true" />}
                  </button>
                  <button className="icon-button" type="button" aria-label="Редактировать транспорт" title="Редактировать" onClick={() => setEditingId(vehicle.id)}><Pencil size={17} aria-hidden="true" /></button>
                  <button className="icon-button danger" type="button" aria-label="Удалить транспорт" title="Удалить" onClick={() => void removeVehicle(vehicle)}><Trash2 size={17} aria-hidden="true" /></button>
                </div>
                {editingId === vehicle.id ? (
                  <div className="vehicle-edit">
                    <div className="section-heading compact-heading">
                      <h3>Изменить профиль</h3>
                      <button className="icon-button" type="button" aria-label="Закрыть редактирование" title="Закрыть" onClick={() => setEditingId(null)}><X size={17} aria-hidden="true" /></button>
                    </div>
                    <VehicleForm key={vehicle.id} initial={{ energyUnit: vehicle.energyUnit, name: vehicle.name, type: vehicle.type }} onCancel={() => setEditingId(null)} onSubmit={(input) => onUpdate(vehicle.id, input)} submitLabel="Сохранить" />
                  </div>
                ) : null}
                {recordErrors[vehicle.id] ? <p className="record-inline-error" role="alert">{recordErrors[vehicle.id]}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state-with-action">
            <p className="empty-state">Транспорта пока нет.</p>
            <button className="secondary-button" type="button" onClick={() => setCreating(true)}>
              <Plus size={17} aria-hidden="true" />
              Добавить транспорт
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

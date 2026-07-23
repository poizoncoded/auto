import { Plus } from "lucide-react";
import type { CSSProperties } from "react";

import { calculateDashboardMetrics } from "@/_pages/dashboard";
import type { BootstrapData } from "@/shared/api/auto";
import { formatRuble } from "@/shared/lib/format";

interface DashboardViewProps {
  data: BootstrapData;
  onAddExpense: () => void;
}

interface MonthTotal {
  amountKopecks: number;
  label: string;
  key: string;
}

const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "short" });

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthTotals(data: BootstrapData): MonthTotal[] {
  const totals = new Map<string, number>();

  for (const expense of data.expenses) {
    const key = expense.occurredOn.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) + expense.amountKopecks);
  }

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = monthKey(date);
    return {
      amountKopecks: totals.get(key) ?? 0,
      key,
      label: monthFormatter.format(date).replace(".", "")
    };
  });
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function DashboardView({ data, onAddExpense }: DashboardViewProps) {
  const metrics = calculateDashboardMetrics(data.expenses);
  const trend = buildMonthTotals(data);
  const maximumTrend = Math.max(...trend.map((entry) => entry.amountKopecks), 1);
  const currentMonth = monthKey(new Date());
  const currentMonthSpend = trend.find((entry) => entry.key === currentMonth)?.amountKopecks ?? 0;

  return (
    <div className="workspace dashboard-workspace">
      <section className="section-intro">
        <div>
          <span className="eyebrow">Обзор</span>
          <h1>Расходы на транспорт</h1>
        </div>
        <div className="section-intro-actions">
          <span className="data-count">{data.expenses.length} записей</span>
          <button className="secondary-button" type="button" onClick={onAddExpense}>
            <Plus size={17} aria-hidden="true" />
            Добавить расход
          </button>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Основные показатели">
        <MetricTile label="Всего" value={formatRuble(metrics.totalKopecks)} />
        <MetricTile label="Этот месяц" value={formatRuble(currentMonthSpend)} />
        <MetricTile label="Пробег" value={metrics.distanceKm ? `${metrics.distanceKm.toLocaleString("ru-RU")} км` : "Нет данных"} />
        <MetricTile
          label="Стоимость км"
          value={metrics.costPerKmKopecks === null ? "Нет данных" : formatRuble(metrics.costPerKmKopecks)}
        />
      </section>

      <section className="analysis-grid">
        <article className="analysis-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">6 месяцев</span>
              <h2>Динамика</h2>
            </div>
          </div>
          <div className="trend-chart" aria-label="Расходы по месяцам">
            {trend.map((entry) => {
              const height = entry.amountKopecks ? Math.max(8, (entry.amountKopecks / maximumTrend) * 100) : 2;
              return (
                <div className="trend-column" key={entry.key}>
                  <span className="trend-value">{entry.amountKopecks ? formatRuble(entry.amountKopecks) : ""}</span>
                  <span className="trend-bar" style={{ "--bar-height": `${height}%` } as CSSProperties} />
                  <span>{entry.label}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="analysis-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Категории</span>
              <h2>Структура расходов</h2>
            </div>
          </div>
          {metrics.categoryTotals.length ? (
            <ul className="split-list">
              {metrics.categoryTotals.slice(0, 6).map((entry) => {
                const percentage = metrics.totalKopecks
                  ? Math.round((entry.amountKopecks / metrics.totalKopecks) * 100)
                  : 0;
                return (
                  <li key={entry.categoryName}>
                    <div>
                      <span>{entry.categoryName}</span>
                      <strong>{formatRuble(entry.amountKopecks)}</strong>
                    </div>
                    <span className="split-track"><span style={{ width: `${percentage}%` }} /></span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state-with-action">
              <p className="empty-state">Расходов пока нет.</p>
              <button className="secondary-button" type="button" onClick={onAddExpense}>
                <Plus size={17} aria-hidden="true" />
                Добавить первый расход
              </button>
            </div>
          )}
        </article>
      </section>

      <section className="efficiency-row" aria-label="Эффективность">
        <MetricTile
          label="Топливо"
          value={metrics.fuelEfficiencyPer100Km === undefined ? "Нет данных" : `${metrics.fuelEfficiencyPer100Km} л / 100 км`}
        />
        <MetricTile
          label="Зарядка"
          value={metrics.energyEfficiencyPer100Km === undefined ? "Нет данных" : `${metrics.energyEfficiencyPer100Km} кВт⋅ч / 100 км`}
        />
      </section>
    </div>
  );
}

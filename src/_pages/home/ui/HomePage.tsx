import {
  CarFront,
  Cloud,
  CloudOff,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  ReceiptText,
  Settings2,
  WalletCards
} from "lucide-react";
import { useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";

import { useWorkspaceData } from "@/_pages/home/model/use-workspace-data";
import { useWorkspaceSession } from "@/_pages/home/model/use-workspace-session";
import { shouldStartReceiptCamera } from "@/_pages/home/model/receipt-import-flow";
import {
  shouldUseClientNavigation,
  type WorkspaceTab,
  workspaceRouteByTab,
  workspaceTabFromPath
} from "@/_pages/home/model/workspace-route";

import { AuthGate } from "./AuthGate";
import { DashboardView } from "./DashboardView";
import { ExpenseWorkspace } from "./ExpenseWorkspace";
import { QuickExpenseSheet } from "./QuickExpenseSheet";
import { ReceiptWorkspace } from "./ReceiptWorkspace";
import { SettingsWorkspace } from "./SettingsWorkspace";
import { VehicleWorkspace } from "./VehicleWorkspace";

interface NavigationItem {
  icon: typeof LayoutDashboard;
  id: WorkspaceTab;
  label: string;
  path: string;
}

const navigation: NavigationItem[] = [
  { icon: LayoutDashboard, id: "dashboard", ...workspaceRouteByTab.dashboard },
  { icon: WalletCards, id: "expenses", ...workspaceRouteByTab.expenses },
  { icon: ReceiptText, id: "receipts", ...workspaceRouteByTab.receipts },
  { icon: CarFront, id: "vehicles", ...workspaceRouteByTab.vehicles },
  { icon: Settings2, id: "settings", ...workspaceRouteByTab.settings }
];

function Navigation({
  activeTab,
  onNavigate
}: {
  activeTab: WorkspaceTab;
  onNavigate: (event: ReactMouseEvent<HTMLAnchorElement>, tab: WorkspaceTab) => void;
}) {
  return (
    <nav className="app-navigation" aria-label="Основная навигация">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <a
            className={activeTab === item.id ? "active" : ""}
            href={item.path}
            key={item.id}
            aria-current={activeTab === item.id ? "page" : undefined}
            onClick={(event) => onNavigate(event, item.id)}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function LoadingPage({ message }: { message: string }) {
  return (
    <main className="loading-page" aria-live="polite">
      <span className="loading-mark">
        <WalletCards size={23} aria-hidden="true" />
      </span>
      <span>{message}</span>
    </main>
  );
}

interface HomePageProps {
  initialTab: WorkspaceTab;
  initialReceiptCamera?: boolean;
}

export default function HomePage({ initialReceiptCamera = false, initialTab }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);
  const session = useWorkspaceSession();
  const workspace = useWorkspaceData(session.user?.id ?? null);
  const openQuickExpense = useCallback(() => setQuickExpenseOpen(true), []);
  const closeQuickExpense = useCallback(() => setQuickExpenseOpen(false), []);
  const startReceiptCamera = shouldStartReceiptCamera({
    cameraRequested: initialReceiptCamera,
    initialTab
  });

  const navigate = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, tab: WorkspaceTab): void => {
      if (!shouldUseClientNavigation(event)) {
        return;
      }

      event.preventDefault();
      const route = workspaceRouteByTab[tab];

      if (window.location.pathname !== route.path) {
        window.history.pushState({ workspace: tab }, "", route.path);
      }

      setActiveTab(tab);
      window.scrollTo({ behavior: "auto", top: 0 });
    },
    []
  );

  useEffect(() => {
    const restoreWorkspace = (): void => {
      setActiveTab(workspaceTabFromPath(window.location.pathname) ?? initialTab);
    };

    window.addEventListener("popstate", restoreWorkspace);
    return () => window.removeEventListener("popstate", restoreWorkspace);
  }, [initialTab]);

  useEffect(() => {
    if (!startReceiptCamera) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("camera");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [startReceiptCamera]);

  if (session.status === "initializing") {
    return <LoadingPage message="Загружаем профиль" />;
  }

  if (session.status === "locked" || !session.user) {
    return (
      <AuthGate
        error={session.error}
        onLogin={session.login}
        onRegister={session.register}
        submitting={session.submitting}
        users={session.users}
      />
    );
  }

  if (workspace.status === "error") {
    return (
      <main className="loading-page" aria-live="polite">
        <span className="loading-mark">
          <CloudOff size={23} aria-hidden="true" />
        </span>
        <span>{workspace.error ?? "Не удалось загрузить данные профиля"}</span>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void workspace.refreshData().catch(() => undefined)}
        >
          Повторить
        </button>
      </main>
    );
  }

  if (!workspace.data || workspace.status !== "ready") {
    return <LoadingPage message="Загружаем данные" />;
  }

  const { data } = workspace;
  const activeLabel = navigation.find((item) => item.id === activeTab)?.label ?? "Обзор";

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">
            <WalletCards size={20} aria-hidden="true" />
          </span>
          <span>Auto Spendings</span>
        </div>
        <Navigation activeTab={activeTab} onNavigate={navigate} />
        <div className="sidebar-profile">
          <span className="profile-initial">
            {session.user.displayName.slice(0, 1).toUpperCase()}
          </span>
          <span>{session.user.displayName}</span>
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div className="header-context">
            <img src="/bg.png" alt="" />
            <div>
              <span className="eyebrow">Auto Spendings</span>
              <strong>{activeLabel}</strong>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="primary-button header-add-expense"
              type="button"
              onClick={openQuickExpense}
            >
              <Plus size={17} aria-hidden="true" />
              Добавить расход
            </button>
            <span
              className={`sync-indicator${workspace.queuedCount ? " pending" : ""}`}
              title={
                workspace.queuedCount
                  ? `В очереди: ${workspace.queuedCount}`
                  : "Все записи синхронизированы"
              }
            >
              {workspace.queuedCount ? (
                <CloudOff size={18} aria-hidden="true" />
              ) : (
                <Cloud size={18} aria-hidden="true" />
              )}
              {workspace.queuedCount ? <span>{workspace.queuedCount}</span> : null}
            </span>
            <button
              className="icon-button"
              type="button"
              aria-label="Заблокировать профиль"
              title="Заблокировать"
              onClick={() => void session.lock()}
            >
              <LockKeyhole size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        {workspace.notice ? (
          <p className="app-notice" role="status">
            {workspace.notice}
          </p>
        ) : null}

        {activeTab === "dashboard" ? (
          <DashboardView data={data} onAddExpense={openQuickExpense} />
        ) : null}
        {activeTab === "expenses" ? (
          <ExpenseWorkspace
            data={data}
            onAddExpense={openQuickExpense}
            onDelete={workspace.deleteExpense}
            onSave={workspace.saveExpense}
          />
        ) : null}
        {activeTab === "receipts" ? (
          <ReceiptWorkspace
            data={data}
            initialImportSource={startReceiptCamera ? "camera" : null}
            onCreateReceipt={workspace.createReceipt}
            onReviewReceipt={workspace.reviewReceipt}
          />
        ) : null}
        {activeTab === "vehicles" ? (
          <VehicleWorkspace
            data={data}
            onCreate={workspace.createVehicle}
            onDelete={workspace.deleteVehicle}
            onUpdate={workspace.updateVehicle}
          />
        ) : null}
        {activeTab === "settings" ? (
          <SettingsWorkspace
            data={data}
            onChangePin={workspace.changePin}
            onCreateCategory={workspace.createCategory}
            onDeleteCategory={workspace.deleteCategory}
            onUpdateCategory={workspace.updateCategory}
          />
        ) : null}
      </section>

      <QuickExpenseSheet
        data={data}
        onClose={closeQuickExpense}
        onSave={workspace.saveExpense}
        open={quickExpenseOpen}
      />

      <div className="mobile-navigation">
        <button
          aria-label="Добавить расход"
          className="mobile-add-expense"
          onClick={openQuickExpense}
          title="Добавить расход"
          type="button"
        >
          <Plus size={24} aria-hidden="true" />
        </button>
        <Navigation activeTab={activeTab} onNavigate={navigate} />
      </div>
    </main>
  );
}

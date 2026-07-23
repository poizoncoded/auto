export const workspaceRouteByTab = {
  dashboard: { label: "Обзор", path: "/dashboard" },
  expenses: { label: "Расходы", path: "/expenses" },
  receipts: { label: "Чеки", path: "/receipts" },
  settings: { label: "Настройки", path: "/settings" },
  vehicles: { label: "Транспорт", path: "/vehicles" }
} as const;

export type WorkspaceTab = keyof typeof workspaceRouteByTab;

const workspaceTabs = Object.keys(workspaceRouteByTab) as WorkspaceTab[];

export interface NavigationActivation {
  altKey: boolean;
  button: number;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export function workspaceTabFromPath(pathname: string): WorkspaceTab | null {
  const normalizedPath = pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
  return workspaceTabs.find((tab) => workspaceRouteByTab[tab].path === normalizedPath) ?? null;
}

export function shouldUseClientNavigation(event: NavigationActivation): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

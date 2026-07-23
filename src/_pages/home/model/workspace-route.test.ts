import { describe, expect, it } from "vitest";

import {
  shouldUseClientNavigation,
  workspaceRouteByTab,
  workspaceTabFromPath
} from "./workspace-route";

describe("workspace routes", () => {
  it("defines every stable workspace URL and Russian label", () => {
    expect(workspaceRouteByTab).toEqual({
      dashboard: { label: "Обзор", path: "/dashboard" },
      expenses: { label: "Расходы", path: "/expenses" },
      receipts: { label: "Чеки", path: "/receipts" },
      settings: { label: "Настройки", path: "/settings" },
      vehicles: { label: "Транспорт", path: "/vehicles" }
    });
  });

  it("maps direct and trailing-slash paths to workspaces", () => {
    expect(workspaceTabFromPath("/dashboard")).toBe("dashboard");
    expect(workspaceTabFromPath("/expenses/")).toBe("expenses");
    expect(workspaceTabFromPath("/receipts")).toBe("receipts");
    expect(workspaceTabFromPath("/vehicles/")).toBe("vehicles");
    expect(workspaceTabFromPath("/settings")).toBe("settings");
  });

  it("rejects root and unsupported paths", () => {
    expect(workspaceTabFromPath("/")).toBeNull();
    expect(workspaceTabFromPath("/unknown")).toBeNull();
  });

  it("uses client navigation only for an unmodified primary click", () => {
    const primaryClick = {
      altKey: false,
      button: 0,
      ctrlKey: false,
      defaultPrevented: false,
      metaKey: false,
      shiftKey: false
    };

    expect(shouldUseClientNavigation(primaryClick)).toBe(true);
    expect(shouldUseClientNavigation({ ...primaryClick, button: 1 })).toBe(false);
    expect(shouldUseClientNavigation({ ...primaryClick, defaultPrevented: true })).toBe(false);
  });

  it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"] as const)(
    "preserves native navigation when %s is pressed",
    (modifier) => {
      const activation = {
        altKey: false,
        button: 0,
        ctrlKey: false,
        defaultPrevented: false,
        metaKey: false,
        shiftKey: false,
        [modifier]: true
      };

      expect(shouldUseClientNavigation(activation)).toBe(false);
    }
  );
});

import { describe, expect, it } from "vitest";

import {
  receiptImportSources,
  resolveCameraMode,
  shouldStartReceiptCamera
} from "./receipt-import-flow";

describe("receipt import flow", () => {
  it("offers camera before photo and manual QR input", () => {
    expect(receiptImportSources.map((source) => source.id)).toEqual(["camera", "photo", "manual"]);
  });

  it("uses live scanning in development when the page has camera access", () => {
    expect(resolveCameraMode({ liveCameraAvailable: true })).toBe("live-scan");
  });

  it("uses live scanning on a secure production origin", () => {
    expect(resolveCameraMode({ liveCameraAvailable: true })).toBe("live-scan");
  });

  it("requires HTTPS instead of presenting a file input as the camera", () => {
    expect(resolveCameraMode({ liveCameraAvailable: false })).toBe("https-required");
  });

  it("starts directly in Camera only for an explicit receipt handoff", () => {
    expect(shouldStartReceiptCamera({ cameraRequested: true, initialTab: "receipts" })).toBe(true);
    expect(shouldStartReceiptCamera({ cameraRequested: false, initialTab: "receipts" })).toBe(false);
    expect(shouldStartReceiptCamera({ cameraRequested: true, initialTab: "dashboard" })).toBe(false);
  });
});

import type { WorkspaceTab } from "./workspace-route";

export type ReceiptImportSource = "camera" | "photo" | "manual";
export type ReceiptCameraMode = "live-scan" | "https-required";

export const receiptImportSources: ReadonlyArray<{
  description: string;
  id: ReceiptImportSource;
  title: string;
}> = [
  { id: "camera", title: "Камера", description: "Снять QR-код" },
  { id: "photo", title: "Фото", description: "Выбрать из медиатеки" },
  { id: "manual", title: "QR-строка", description: "Вставить вручную" }
];

export function resolveCameraMode({
  liveCameraAvailable
}: {
  liveCameraAvailable: boolean;
}): ReceiptCameraMode {
  return liveCameraAvailable ? "live-scan" : "https-required";
}

export function shouldStartReceiptCamera({
  cameraRequested,
  initialTab
}: {
  cameraRequested: boolean;
  initialTab: WorkspaceTab;
}): boolean {
  return cameraRequested && initialTab === "receipts";
}

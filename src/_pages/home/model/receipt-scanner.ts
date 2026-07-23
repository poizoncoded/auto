import { resolveDevelopmentCameraHandoffUrl } from "@/shared/lib/development-https";

export { resolveDevelopmentCameraUrl } from "@/shared/lib/development-https";

type CameraHandoffRequest = (input: string, init?: RequestInit) => Promise<Response>;

export async function requestDevelopmentCameraHandoff(
  request: CameraHandoffRequest = fetch
): Promise<string> {
  try {
    const response = await request("/api/development/https-camera", {
      body: "{}",
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("Development camera handoff request failed");
    }

    const payload = await response.json() as { url?: unknown };
    const url = resolveDevelopmentCameraHandoffUrl(payload.url);

    if (!url) {
      throw new Error("Development camera handoff response is invalid");
    }

    return url;
  } catch {
    throw new Error("Не удалось открыть защищённую камеру");
  }
}

function errorName(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("name" in error)) {
    return null;
  }

  return typeof error.name === "string" ? error.name : null;
}

interface LiveCameraEnvironment {
  isSecureContext: boolean;
  mediaDevices?: Pick<MediaDevices, "getUserMedia">;
}

export function canUseLiveCamera(environment: LiveCameraEnvironment): boolean {
  return environment.isSecureContext && typeof environment.mediaDevices?.getUserMedia === "function";
}

export function cameraFailureMessage(secureContext: boolean, error: unknown): string {
  if (!secureContext) {
    return "Для сканирования камерой откройте приложение по HTTPS. Сейчас можно сфотографировать QR или выбрать фото.";
  }

  switch (errorName(error)) {
    case "NotAllowedError":
    case "SecurityError":
      return "Доступ к камере запрещён. Разрешите его в настройках браузера или выберите фото QR-кода.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Камера не найдена. Сфотографируйте QR на другом устройстве или выберите готовое фото.";
    default:
      return "Не удалось открыть камеру. Сфотографируйте QR, выберите фото или вставьте QR-строку.";
  }
}

import { describe, expect, it, vi } from "vitest";

import {
  cameraFailureMessage,
  canUseLiveCamera,
  requestDevelopmentCameraHandoff,
  resolveDevelopmentCameraUrl
} from "./receipt-scanner";

describe("canUseLiveCamera", () => {
  const getUserMedia = () => Promise.reject(new Error("not called"));

  it("allows live scanning in a secure context with media devices", () => {
    expect(canUseLiveCamera({ isSecureContext: true, mediaDevices: { getUserMedia } })).toBe(true);
  });

  it("uses the photo fallback on an insecure LAN origin", () => {
    expect(canUseLiveCamera({ isSecureContext: false, mediaDevices: { getUserMedia } })).toBe(false);
  });

  it("uses the photo fallback when the browser has no media device API", () => {
    expect(canUseLiveCamera({ isSecureContext: true })).toBe(false);
  });
});

describe("cameraFailureMessage", () => {
  it("explains the HTTPS requirement for a LAN origin", () => {
    expect(cameraFailureMessage(false, new TypeError("getUserMedia is unavailable"))).toBe(
      "Для сканирования камерой откройте приложение по HTTPS. Сейчас можно сфотографировать QR или выбрать фото."
    );
  });

  it.each(["NotAllowedError", "SecurityError"])(
    "explains how to recover from denied camera permission (%s)",
    (name) => {
      expect(cameraFailureMessage(true, { name })).toBe(
        "Доступ к камере запрещён. Разрешите его в настройках браузера или выберите фото QR-кода."
      );
    }
  );

  it.each(["NotFoundError", "OverconstrainedError"])("reports that no usable camera was found (%s)", (name) => {
    expect(cameraFailureMessage(true, { name })).toBe(
      "Камера не найдена. Сфотографируйте QR на другом устройстве или выберите готовое фото."
    );
  });

  it("keeps a usable photo fallback for other failures", () => {
    expect(cameraFailureMessage(true, new Error("camera failed"))).toBe(
      "Не удалось открыть камеру. Сфотографируйте QR, выберите фото или вставьте QR-строку."
    );
  });
});

describe("resolveDevelopmentCameraUrl", () => {
  it("opens the same workspace through the trusted tunnel", () => {
    expect(resolveDevelopmentCameraUrl("https://camera-ready.trycloudflare.com", "/receipts")).toBe(
      "https://camera-ready.trycloudflare.com/receipts"
    );
  });

  it.each([
    null,
    "http://camera-ready.trycloudflare.com",
    "https://camera-ready.trycloudflare.com.evil.example"
  ])("rejects an unavailable or unsafe development origin: %s", (url) => {
    expect(resolveDevelopmentCameraUrl(url, "/receipts")).toBeNull();
  });
});

describe("requestDevelopmentCameraHandoff", () => {
  it("returns the validated one-time HTTPS URL", async () => {
    const request = vi.fn(async () => Response.json({
      url: "https://camera-ready.trycloudflare.com/api/development/https-camera?token=single-use-camera-token"
    }));

    await expect(requestDevelopmentCameraHandoff(request)).resolves.toBe(
      "https://camera-ready.trycloudflare.com/api/development/https-camera?token=single-use-camera-token"
    );
    expect(request).toHaveBeenCalledWith("/api/development/https-camera", {
      body: "{}",
      headers: { "content-type": "application/json" },
      method: "POST"
    });
  });

  it.each([
    ["failed request", async () => new Response(null, { status: 401 })],
    ["unsafe response", async () => Response.json({ url: "https://attacker.example/camera" })]
  ])("rejects a %s", async (_label, request) => {
    await expect(requestDevelopmentCameraHandoff(request)).rejects.toThrow(
      "Не удалось открыть защищённую камеру"
    );
  });
});

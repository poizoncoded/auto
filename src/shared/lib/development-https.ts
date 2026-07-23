const quickTunnelHostname = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.trycloudflare\.com$/;
const cameraHandoffToken = /^[A-Za-z0-9_-]{16,128}$/;

export const developmentCameraHandoffPath = "/api/development/https-camera";

export function quickTunnelOrigin(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !quickTunnelHostname.test(url.hostname)
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function resolveDevelopmentCameraUrl(origin: unknown, pathname: string): string | null {
  const trustedOrigin = quickTunnelOrigin(origin);

  if (!trustedOrigin) {
    return null;
  }

  const url = new URL(trustedOrigin);
  url.pathname = pathname.startsWith("/") ? pathname : "/receipts";
  return url.toString();
}

export function isDevelopmentCameraHandoffToken(value: unknown): value is string {
  return typeof value === "string" && cameraHandoffToken.test(value);
}

export function resolveDevelopmentCameraHandoffUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    const token = url.searchParams.get("token");

    if (
      !quickTunnelOrigin(url.origin) ||
      url.pathname !== developmentCameraHandoffPath ||
      !isDevelopmentCameraHandoffToken(token) ||
      [...url.searchParams.keys()].some((key) => key !== "token")
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

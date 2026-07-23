import type { APIRoute } from "astro";

import { getDataSource } from "@/server/database/data-source";
import {
  buildDevelopmentCameraHandoffUrl,
  developmentCameraHandoffs
} from "@/server/development/https-camera-handoff";
import { readDevelopmentHttpsUrl } from "@/server/development/https-tunnel";
import { requireUser, setSessionCookie } from "@/server/http/authorization";
import { AppError } from "@/server/http/error";
import { api, requestOrigin } from "@/server/http/response";
import { createSession } from "@/server/security/session-store";

function developmentOnly(): void {
  if (!import.meta.env.DEV) {
    throw new AppError("Маршрут доступен только в разработке", "NOT_FOUND", 404);
  }
}

export const POST: APIRoute = api(async (context) => {
  developmentOnly();

  const userId = await requireUser(context);
  const origin = await readDevelopmentHttpsUrl();

  if (!origin) {
    throw new AppError(
      "Защищённая камера ещё запускается",
      "HTTPS_TUNNEL_UNAVAILABLE",
      503
    );
  }

  const token = developmentCameraHandoffs.issue(userId);
  const url = buildDevelopmentCameraHandoffUrl(origin, token);

  if (!url) {
    throw new AppError(
      "Защищённый адрес камеры недоступен",
      "HTTPS_TUNNEL_UNAVAILABLE",
      503
    );
  }

  return Response.json(
    { url },
    {
      headers: {
        "cache-control": "no-store",
        "referrer-policy": "no-referrer"
      }
    }
  );
});

export const GET: APIRoute = api(async (context) => {
  developmentOnly();

  const origin = await readDevelopmentHttpsUrl();

  if (!origin || requestOrigin(context.request) !== origin) {
    throw new AppError("Откройте ссылку через активный HTTPS-туннель", "INVALID_ORIGIN", 400);
  }

  const token = new URL(context.request.url).searchParams.get("token");
  const userId = token ? developmentCameraHandoffs.consume(token) : null;

  if (!userId) {
    throw new AppError("Ссылка на камеру истекла", "HANDOFF_EXPIRED", 410);
  }

  const session = await createSession(await getDataSource(), userId);
  setSessionCookie(context, session);

  return new Response(null, {
    headers: {
      "cache-control": "no-store",
      location: "/receipts?camera=1",
      "referrer-policy": "no-referrer"
    },
    status: 303
  });
});

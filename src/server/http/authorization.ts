import type { APIContext } from "astro";

import { getDataSource } from "@/server/database/data-source";
import { AppError } from "@/server/http/error";
import { requestUsesHttps } from "@/server/http/response";
import {
  destroySession,
  getSessionDurationSeconds,
  getSessionUserId,
  type ActiveSession
} from "@/server/security/session-store";

export const sessionCookieName = "auto_session";

export async function requireUser(context: APIContext): Promise<string> {
  const token = context.cookies.get(sessionCookieName)?.value;

  if (!token) {
    throw new AppError("Нужна разблокировка профиля", "UNAUTHORIZED", 401);
  }

  const userId = await getSessionUserId(await getDataSource(), token);

  if (!userId) {
    context.cookies.delete(sessionCookieName, { path: "/" });
    throw new AppError("Сессия истекла", "UNAUTHORIZED", 401);
  }

  return userId;
}

export function setSessionCookie(context: APIContext, session: ActiveSession): void {
  context.cookies.set(sessionCookieName, session.token, {
    httpOnly: true,
    maxAge: getSessionDurationSeconds(),
    path: "/",
    sameSite: "lax",
    secure: import.meta.env.PROD || requestUsesHttps(context.request)
  });
}

export async function clearSessionCookie(context: APIContext): Promise<void> {
  const token = context.cookies.get(sessionCookieName)?.value;

  try {
    if (token) {
      await destroySession(await getDataSource(), token);
    }
  } finally {
    context.cookies.delete(sessionCookieName, { path: "/" });
  }
}

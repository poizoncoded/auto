import { requireUser, setSessionCookie } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json, readJson } from "@/server/http/response";
import { changePinSchema } from "@/server/http/schemas";
import { changePin } from "@/server/services/auth";
import { consumeAuthAttempt, resetAuthAttempts } from "@/server/security/auth-rate-limit";

export const PATCH = api(async (context) => {
  const userId = await requireUser(context);
  const input = await readJson(context.request, changePinSchema);
  const database = await getDataSource();
  const attemptKey = {
    clientAddress: context.clientAddress,
    operation: "pin-change" as const,
    subject: userId
  };
  await consumeAuthAttempt(database, attemptKey);
  const session = await changePin(database, userId, input);
  setSessionCookie(context, session);
  await resetAuthAttempts(database, attemptKey);
  return json({ ok: true });
});

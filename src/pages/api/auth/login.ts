import { setSessionCookie } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json, readJson } from "@/server/http/response";
import { loginSchema } from "@/server/http/schemas";
import { authenticateUser } from "@/server/services/auth";
import { createSession } from "@/server/security/session-store";
import { consumeAuthAttempt, resetAuthAttempts } from "@/server/security/auth-rate-limit";

export const POST = api(async (context) => {
  const input = await readJson(context.request, loginSchema);
  const database = await getDataSource();
  const attemptKey = {
    clientAddress: context.clientAddress,
    operation: "login" as const,
    subject: input.userId
  };
  await consumeAuthAttempt(database, attemptKey);
  const user = await authenticateUser(database, input);
  setSessionCookie(context, await createSession(database, user.id));
  await resetAuthAttempts(database, attemptKey);
  return json({ user });
});

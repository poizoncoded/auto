import { setSessionCookie } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json, readJson } from "@/server/http/response";
import { registerUserSchema } from "@/server/http/schemas";
import { registerUser } from "@/server/services/auth";
import { createSession } from "@/server/security/session-store";
import { consumeAuthAttempt } from "@/server/security/auth-rate-limit";

export const POST = api(async (context) => {
  const input = await readJson(context.request, registerUserSchema);
  const database = await getDataSource();
  await consumeAuthAttempt(database, {
    clientAddress: context.clientAddress,
    operation: "register"
  });
  const user = await registerUser(database, input);
  setSessionCookie(context, await createSession(database, user.id));
  return json({ user }, 201);
});

import { clearSessionCookie } from "@/server/http/authorization";
import { api, json } from "@/server/http/response";

export const POST = api(async (context) => {
  await clearSessionCookie(context);
  return json({ ok: true });
});

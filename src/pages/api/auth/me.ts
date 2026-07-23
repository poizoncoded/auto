import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json } from "@/server/http/response";
import { getPublicUser } from "@/server/services/auth";

export const GET = api(async (context) => {
  const user = await getPublicUser(await getDataSource(), await requireUser(context));
  return json({ user });
});

import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json } from "@/server/http/response";
import { getBootstrap } from "@/server/services/finance";

export const GET = api(async (context) => {
  const userId = await requireUser(context);
  return json(await getBootstrap(await getDataSource(), userId));
});

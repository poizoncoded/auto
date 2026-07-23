import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api } from "@/server/http/response";
import { getBootstrap } from "@/server/services/finance";

export const GET = api(async (context) => {
  const userId = await requireUser(context);
  const data = await getBootstrap(await getDataSource(), userId);

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-disposition": "attachment; filename=auto-spendings.json",
      "content-type": "application/json; charset=utf-8"
    }
  });
});

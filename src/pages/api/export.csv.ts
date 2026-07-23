import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api } from "@/server/http/response";
import { exportExpensesCsv } from "@/server/services/export";
import { getBootstrap } from "@/server/services/finance";

export const GET = api(async (context) => {
  const userId = await requireUser(context);
  const data = await getBootstrap(await getDataSource(), userId);

  return new Response(await exportExpensesCsv(data), {
    headers: {
      "content-disposition": "attachment; filename=auto-spendings.csv",
      "content-type": "text/csv; charset=utf-8"
    }
  });
});

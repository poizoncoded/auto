import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json, readJson } from "@/server/http/response";
import { createExpenseSchema } from "@/server/http/schemas";
import { createExpense, getBootstrap } from "@/server/services/finance";

export const GET = api(async (context) => {
  const userId = await requireUser(context);
  const { expenses } = await getBootstrap(await getDataSource(), userId);
  return json({ expenses });
});

export const POST = api(async (context) => {
  const userId = await requireUser(context);
  const expense = await createExpense(
    await getDataSource(),
    userId,
    await readJson(context.request, createExpenseSchema)
  );
  return json({ expense }, 201);
});

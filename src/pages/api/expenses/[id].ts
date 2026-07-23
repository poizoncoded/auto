import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { AppError } from "@/server/http/error";
import { api, json, readJson } from "@/server/http/response";
import { recordIdSchema, updateExpenseSchema } from "@/server/http/schemas";
import { deleteExpense, updateExpense } from "@/server/services/finance";

function readExpenseId(value: string | undefined): string {
  const parsed = recordIdSchema.safeParse(value);

  if (!parsed.success) {
    throw new AppError("Некорректный идентификатор расхода", "INVALID_INPUT");
  }

  return parsed.data;
}

export const PATCH = api(async (context) => {
  const userId = await requireUser(context);
  const expense = await updateExpense(
    await getDataSource(),
    userId,
    readExpenseId(context.params.id),
    await readJson(context.request, updateExpenseSchema)
  );
  return json({ expense });
});

export const DELETE = api(async (context) => {
  const userId = await requireUser(context);
  await deleteExpense(await getDataSource(), userId, readExpenseId(context.params.id));
  return json({ ok: true });
});

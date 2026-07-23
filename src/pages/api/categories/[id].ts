import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { AppError } from "@/server/http/error";
import { api, json, readJson } from "@/server/http/response";
import { recordIdSchema, updateCategorySchema } from "@/server/http/schemas";
import { deleteCategory, updateCategory } from "@/server/services/finance";

function readCategoryId(value: string | undefined): string {
  const parsed = recordIdSchema.safeParse(value);

  if (!parsed.success) {
    throw new AppError("Некорректный идентификатор категории", "INVALID_INPUT");
  }

  return parsed.data;
}

export const PATCH = api(async (context) => {
  const userId = await requireUser(context);
  const category = await updateCategory(
    await getDataSource(),
    userId,
    readCategoryId(context.params.id),
    await readJson(context.request, updateCategorySchema)
  );
  return json({ category });
});

export const DELETE = api(async (context) => {
  const userId = await requireUser(context);
  await deleteCategory(await getDataSource(), userId, readCategoryId(context.params.id));
  return json({ ok: true });
});

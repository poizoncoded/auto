import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json, readJson } from "@/server/http/response";
import { createCategorySchema } from "@/server/http/schemas";
import { createCategory, getBootstrap } from "@/server/services/finance";

export const GET = api(async (context) => {
  const userId = await requireUser(context);
  const { categories } = await getBootstrap(await getDataSource(), userId);
  return json({ categories });
});

export const POST = api(async (context) => {
  const userId = await requireUser(context);
  const category = await createCategory(
    await getDataSource(),
    userId,
    await readJson(context.request, createCategorySchema)
  );
  return json({ category }, 201);
});

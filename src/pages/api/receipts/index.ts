import { requireUser } from "@/server/http/authorization";
import { getDataSource } from "@/server/database/data-source";
import { api, json, readJson } from "@/server/http/response";
import { createReceiptSchema } from "@/server/http/schemas";
import { createReceipt, getBootstrap } from "@/server/services/finance";

export const GET = api(async (context) => {
  const userId = await requireUser(context);
  const { receipts } = await getBootstrap(await getDataSource(), userId);
  return json({ receipts });
});

export const POST = api(async (context) => {
  const userId = await requireUser(context);
  const receipt = await createReceipt(
    await getDataSource(),
    userId,
    await readJson(context.request, createReceiptSchema)
  );
  return json({ receipt }, 201);
});
